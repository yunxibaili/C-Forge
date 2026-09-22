"""C-Forge tracer: user C source -> gcc -g -O0 -> gdb python step trace -> TraceEvent[]."""

import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
TEMPLATE = BACKEND_DIR / "gdb_trace_template.py"

GCC = shutil.which("gcc") or r"C:\msys64\ucrt64\bin\gcc.exe"
GDB = shutil.which("gdb") or r"C:\msys64\ucrt64\bin\gdb.exe"

MAX_STEPS = 1500
RUN_TIMEOUT = 25  # seconds


class CompileError(Exception):
    def __init__(self, message: str, raw: str = ""):
        super().__init__(message)
        self.message = message
        self.raw = raw


def compile_c(source: str, workdir: Path) -> Path:
    src_path = workdir / "program.c"
    src_path.write_text(source, encoding="utf-8")
    exe = workdir / "program.exe"
    proc = subprocess.run(
        [GCC, "-g", "-O0", "-std=c11", "-o", str(exe), str(src_path)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        cwd=str(workdir),
    )
    if proc.returncode != 0 or not exe.exists():
        msg = proc.stderr or proc.stdout or "compile failed"
        msg = msg.replace(str(src_path), "program.c")
        raise CompileError(msg, msg)
    return exe


def run_gdb(exe: Path, source: str, workdir: Path) -> dict:
    stdout_file = workdir / "inferior_stdout.txt"
    events_file = workdir / "events.json"
    cfg = {
        "source": str(workdir / "program.c"),
        "source_lines": source.splitlines(),
        "stdout_file": str(stdout_file),
        "events_file": str(events_file),
        "max_steps": MAX_STEPS,
    }
    cfg_path = workdir / "trace_cfg.json"
    cfg_path.write_text(json.dumps(cfg, ensure_ascii=False), encoding="utf-8")

    template = TEMPLATE.read_text(encoding="utf-8")
    script_path = workdir / "trace_script.py"
    script_path.write_text(template.replace("@@CFG@@", str(cfg_path).replace("\\", "/")), encoding="utf-8")

    try:
        subprocess.run(
            [GDB, "-batch", "-x", str(script_path), str(exe)],
            capture_output=True,
            timeout=RUN_TIMEOUT,
            cwd=str(workdir),
        )
    except subprocess.TimeoutExpired:
        pass

    if not events_file.exists():
        return {"events": [], "truncated": False, "trace_error": "gdb produced no events"}
    data = json.loads(events_file.read_text(encoding="utf-8"))
    return {"events": data.get("events", []), "truncated": data.get("truncated", False), "trace_error": None}


def _vals(ev, key):
    return ev.get(key) or {}


def _array_map(ev):
    return {a["name"]: a for a in ev.get("arrays") or []}


def array_changed(prev, cur):
    pa, ca = _array_map(prev), _array_map(cur)
    for name, carr in ca.items():
        prev_arr = pa.get(name)
        if not prev_arr:
            continue
        if (prev_arr.get("elems") or []) != (carr.get("elems") or []):
            return name
    return None


def pointers_moved(prev, cur):
    pp = {p["name"]: p.get("value") for p in prev.get("pointers") or []}
    cp = {p["name"]: p.get("value") for p in cur.get("pointers") or []}
    changed = []
    for name, val in cp.items():
        if name in pp and pp[name] != val:
            changed.append(name)
    return changed


def scalar_writes(prev, cur):
    pv, cv = _vals(prev, "variables"), _vals(cur, "variables")
    changed = {}
    for name, meta in cv.items():
        old = pv.get(name)
        if old is None:
            if meta.get("value") is not None or meta.get("fields"):
                changed[name] = meta.get("value")
            continue
        if old.get("value") != meta.get("value") or old.get("fields") != meta.get("fields"):
            changed[name] = meta.get("value")
    return changed


CMP_RE = re.compile(r"[<>]=?|==|!=")


NAME_RE = re.compile(r"\b([A-Za-z_][A-Za-z0-9_]*)\b")


def reveal_filter(events):
    """Hide variables until the source line that mentions them has executed.

    GDB exposes uninitialized stack slots as garbage; revealing a name only
    after its first textual appearance keeps the panels honest.
    """
    revealed = set()
    for ev in events:
        ev["variables"] = {
            k: v for k, v in (ev.get("variables") or {}).items()
            if k in revealed or v.get("arg")
        }
        ev["arrays"] = [a for a in (ev.get("arrays") or []) if a.get("name") in revealed]
        ev["pointers"] = [p for p in (ev.get("pointers") or []) if p.get("name") in revealed]
        ev["memory"] = [m for m in (ev.get("memory") or []) if m.get("name") in revealed]
        ev["linked_lists"] = [
            lst for lst in (ev.get("linked_lists") or []) if lst.get("head") in revealed
        ]
        for m in NAME_RE.finditer(ev.get("line_text") or ""):
            revealed.add(m.group(1))


def group_swap_runs(events):
    """Bubble-sort style swaps span several writes; mark the run's last event as swap.

    A run is a maximal stretch of consecutive events whose array state keeps
    changing; if net effect on any one array is exactly two cross-equal cells,
    the run is one swap.
    """
    marks = {}
    i = 1
    while i < len(events):
        name = array_changed(events[i - 1], events[i])
        if not name:
            i += 1
            continue
        start = i - 1  # state before first change
        j = i
        while j + 1 < len(events) and array_changed(events[j], events[j + 1]) == name:
            j += 1
        # events[start] is pre-swap, events[j] is post-swap
        old = (_array_map(events[start]).get(name) or {}).get("elems")
        new = (_array_map(events[j]).get(name) or {}).get("elems")
        if old and new and len(old) == len(new):
            diff = [k for k in range(len(old)) if old[k] != new[k]]
            if len(diff) == 2 and old[diff[0]] == new[diff[1]] and old[diff[1]] == new[diff[0]]:
                marks[j] = ("swap", {"array": name, "i": diff[0], "j": diff[1]})
                for k in range(i, j):
                    marks[k] = ("swap_step", None)
        i = j + 1
    return marks


def classify(events):
    stats = {"comparisons": 0, "swaps": 0, "visits": 0}
    swaps_detail = []
    reveal_filter(events)
    swap_marks = group_swap_runs(events)
    prev = None
    for idx, ev in enumerate(events):
        line_text = ev.get("line_text") or ""
        if prev is None:
            ev["event"] = "start"
        elif len(ev.get("stack") or []) > len(prev.get("stack") or []):
            ev["event"] = "call"
        elif idx in swap_marks and swap_marks[idx][0] == "swap":
            ev["event"] = "swap"
            ev["swap"] = swap_marks[idx][1]
            stats["swaps"] += 1
            swaps_detail.append(ev["swap"])
        elif idx in swap_marks:
            ev["event"] = "swap_step"
        elif pointers_moved(prev, ev):
            ev["event"] = "pointer_move"
        elif array_changed(prev, ev):
            ev["event"] = "array_write"
        elif scalar_writes(prev, ev):
            ev["event"] = "write"
        elif len(ev.get("stack") or []) < len(prev.get("stack") or []):
            ev["event"] = "return"
        elif CMP_RE.search(line_text):
            ev["event"] = "compare"
            stats["comparisons"] += 1
        else:
            ev["event"] = "step"

        for name in _array_map(ev):
            if re.search(re.escape(name) + r"\s*\[", line_text):
                stats["visits"] += 1
        ev["stats"] = dict(stats)
        prev = ev
    if events:
        # program-exit flush: make sure the tail of stdout lands on the last event
        events[-1]["stdout"] = events[-1].get("stdout") or ""
    return stats


def trace_source(source: str) -> dict:
    """Compile + trace. Returns {ok, events, stats, compile_error, trace_error, truncated}."""
    workdir = Path(tempfile.mkdtemp(prefix="cforge_"))
    try:
        try:
            exe = compile_c(source, workdir)
        except CompileError as e:
            return {
                "ok": False,
                "events": [],
                "stats": {},
                "compile_error": e.message,
                "trace_error": None,
                "truncated": False,
            }
        result = run_gdb(exe, source, workdir)
        events = result["events"]
        stats = classify(events) if events else {}
        return {
            "ok": True,
            "events": events,
            "stats": stats,
            "compile_error": None,
            "trace_error": result.get("trace_error"),
            "truncated": result.get("truncated", False),
        }
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


if __name__ == "__main__":
    import sys

    path = sys.argv[1]
    src = Path(path).read_text(encoding="utf-8")
    out = trace_source(src)
    print(json.dumps(
        {
            "ok": out["ok"],
            "compile_error": out["compile_error"],
            "trace_error": out["trace_error"],
            "truncated": out["truncated"],
            "n_events": len(out["events"]),
            "stats": out["stats"],
        },
        ensure_ascii=False,
        indent=2,
    ))
    if len(sys.argv) > 2:
        Path(sys.argv[2]).write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
