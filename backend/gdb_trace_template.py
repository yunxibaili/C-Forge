import gdb
import json
import os

CFG_PATH = "@@CFG@@"

with open(CFG_PATH, "r", encoding="utf-8") as f:
    CFG = json.load(f)

SRC_NAME = os.path.basename(CFG["source"])
STDOUT_FILE = CFG["stdout_file"]
EVENTS_FILE = CFG["events_file"]
MAX_STEPS = int(CFG.get("max_steps", 1500))

gdb.execute("set pagination off")
gdb.execute("set confirm off")
gdb.execute("set print pretty off")
gdb.execute("set breakpoint pending on")

events = []
stdout_seen = 0
truncated = False


def read_stdout():
    global stdout_seen
    try:
        with open(STDOUT_FILE, "rb") as f:
            data = f.read()
        text = data[stdout_seen:].decode("utf-8", errors="replace")
        stdout_seen = len(data)
        return text
    except OSError:
        return ""


def cumulative_stdout():
    try:
        with open(STDOUT_FILE, "rb") as f:
            return f.read().decode("utf-8", errors="replace")
    except OSError:
        return ""


def strip_type(t):
    try:
        while t is not None and t.code == gdb.TYPE_CODE_TYPEDEF:
            t = t.target()
    except Exception:
        pass
    return t


def addr_of(val):
    try:
        a = val.address
        if a is None:
            return None
        return int(a.cast(gdb.lookup_type("long long")))
    except Exception:
        return None


def type_name(t):
    try:
        return str(t)
    except Exception:
        return "?"


def is_int_like(t):
    return t.code in (
        gdb.TYPE_CODE_INT,
        gdb.TYPE_CODE_ENUM,
        gdb.TYPE_CODE_CHAR,
        gdb.TYPE_CODE_BOOL,
    )


def simple_value(val):
    """Convert a gdb.Value to a json-safe scalar descriptor."""
    try:
        t = strip_type(val.type)
        if t is None:
            return {"kind": "unknown"}
        code = t.code
        if code == gdb.TYPE_CODE_PTR:
            try:
                p = int(val)
            except Exception:
                try:
                    p = int(val.as_pointer())
                except Exception:
                    p = 0
            return {"kind": "ptr", "addr": int(p)}
        if code == gdb.TYPE_CODE_ARRAY:
            return {"kind": "array"}
        if code in (gdb.TYPE_CODE_INT, gdb.TYPE_CODE_ENUM, gdb.TYPE_CODE_CHAR, gdb.TYPE_CODE_BOOL):
            return {"kind": "int", "value": int(val), "type": type_name(t)}
        if code == gdb.TYPE_CODE_FLT:
            return {"kind": "float", "value": float(val), "type": type_name(t)}
        if code in (gdb.TYPE_CODE_STRUCT, gdb.TYPE_CODE_UNION):
            return {"kind": "struct", "type": type_name(t), "addr": addr_of(val)}
        if code == gdb.TYPE_CODE_TYPEDEF:
            return simple_value(val.cast(val.type.target()) if False else val)
        return {"kind": "other", "type": type_name(t), "str": str(val)}
    except Exception as e:
        return {"kind": "error", "str": str(e)}


def read_struct_fields(val, max_fields=12):
    out = {}
    try:
        t = strip_type(val.type)
        for f in t.fields()[:max_fields]:
            if f.bitpos is None:
                continue
            try:
                fv = val[f.name]
                out[f.name] = simple_value(fv)
            except Exception:
                out[f.name] = {"kind": "error"}
    except Exception:
        pass
    return out


def struct_ptr_field_types(ptr_val):
    """Return {field_name: type} of the struct a pointer points to."""
    try:
        t = strip_type(ptr_val.type)
        if t.code != gdb.TYPE_CODE_PTR:
            return {}, None
        target = strip_type(t.target())
        if target.code not in (gdb.TYPE_CODE_STRUCT, gdb.TYPE_CODE_UNION):
            return {}, None
        fields = {}
        for f in target.fields():
            if f.bitpos is not None:
                fields[f.name] = f.type
        return fields, target
    except Exception:
        return {}, None


def deref_struct(ptr_val, addr):
    try:
        ptype = strip_type(ptr_val.type)
        return gdb.Value(addr).cast(ptype).dereference()
    except Exception:
        return None


def in_our_file(frame):
    try:
        sal = frame.find_sal()
        if sal.symtab is None:
            return False
        return os.path.basename(sal.symtab.filename) == SRC_NAME
    except Exception:
        return False


def flush_inferior():
    try:
        gdb.execute("call (int)fflush(0)", to_string=True)
    except Exception:
        pass


def capture(step):
    flush_inferior()
    fr = gdb.selected_frame()
    try:
        line = int(fr.find_sal().line)
    except Exception:
        line = -1
    try:
        function = fr.name() or "?"
    except Exception:
        function = "?"

    stack = []
    f = fr
    guard = 0
    while f is not None and guard < 32:
        try:
            stack.append(f.name() or "?")
            f = f.older()
        except Exception:
            break
        guard += 1

    variables = {}
    arrays = []
    pointers = []
    memory = []
    addr_to_name = {}

    block = fr.block()
    seen = set()
    while block is not None:
        try:
            syms = list(block)
        except Exception:
            syms = []
        for sym in syms:
            try:
                if not (sym.is_variable or sym.is_argument):
                    continue
            except Exception:
                continue
            name = sym.name
            if not name or name in seen:
                continue
            seen.add(name)
            try:
                val = sym.value(fr)
            except Exception:
                continue
            a = addr_of(val)
            if a is not None:
                addr_to_name[a] = name
            t = strip_type(val.type)
            if t is None:
                continue
            code = t.code

            if code == gdb.TYPE_CODE_PTR:
                try:
                    paddr = int(val)
                except Exception:
                    paddr = 0
                _, target_t = struct_ptr_field_types(val)
                pointers.append(
                    {
                        "name": name,
                        "value": "0x%x" % (paddr & 0xFFFFFFFFFFFFFFFF),
                        "target_addr": paddr,
                        "target_type": type_name(strip_type(t.target())) if paddr else None,
                        "is_struct": target_t is not None,
                        "null": paddr == 0,
                    }
                )
            elif code == gdb.TYPE_CODE_ARRAY:
                try:
                    lo, hi = t.range()
                    n = hi - lo + 1
                except Exception:
                    try:
                        lo, hi = t.range
                        n = hi - lo + 1
                    except Exception:
                        lo, n = 0, 0
                elems = []
                maxn = min(n, 64)
                base = addr_of(val)
                esize = 0
                try:
                    esize = int(strip_type(t.target()).sizeof)
                except Exception:
                    esize = 0
                for i in range(maxn):
                    try:
                        ev = simple_value(val[lo + i])
                        elems.append(ev.get("value", ev.get("str")))
                    except Exception:
                        elems.append(None)
                arrays.append(
                    {
                        "name": name,
                        "addr": "0x%x" % (base & 0xFFFFFFFFFFFFFFFF) if base else None,
                        "length": n,
                        "elem_size": esize,
                        "elems": elems,
                        "type": type_name(t),
                    }
                )
                if base is not None:
                    addr_to_name[base] = name
            elif code in (gdb.TYPE_CODE_INT, gdb.TYPE_CODE_ENUM, gdb.TYPE_CODE_CHAR, gdb.TYPE_CODE_BOOL, gdb.TYPE_CODE_FLT):
                try:
                    if code == gdb.TYPE_CODE_FLT:
                        v = float(val)
                    else:
                        v = int(val)
                except Exception:
                    v = None
                variables[name] = {"type": type_name(t), "value": v, "arg": bool(getattr(sym, "is_argument", False))}
                if a is not None:
                    memory.append(
                        {
                            "address": "0x%x" % (a & 0xFFFFFFFFFFFFFFFF),
                            "name": name,
                            "value": v,
                        }
                    )
            elif code in (gdb.TYPE_CODE_STRUCT, gdb.TYPE_CODE_UNION):
                fields = read_struct_fields(val)
                variables[name] = {"type": type_name(t), "fields": fields, "arg": bool(getattr(sym, "is_argument", False))}
                if a is not None:
                    memory.append(
                        {
                            "address": "0x%x" % (a & 0xFFFFFFFFFFFFFFFF),
                            "name": name,
                            "value": summarize_fields(fields),
                        }
                    )
            else:
                try:
                    variables[name] = {"type": type_name(t), "value": str(val)}
                except Exception:
                    pass
        block = block.superblock

    # resolve pointer targets by name; then by array window (p = &a[i])
    for p in pointers:
        p["target"] = addr_to_name.get(p["target_addr"])
        p["target_index"] = None
        if p["target"] is None and not p["null"]:
            for arr in arrays:
                if not arr.get("addr") or not arr.get("elem_size"):
                    continue
                base = int(arr["addr"], 16)
                end = base + arr["length"] * arr["elem_size"]
                if base <= p["target_addr"] < end:
                    p["target"] = arr["name"]
                    p["target_index"] = (p["target_addr"] - base) // arr["elem_size"]
                    break

    # walk struct pointer chains -> linked lists
    linked_lists = []
    for p in pointers:
        if not p.get("is_struct") or p["null"]:
            continue
        try:
            pval = gdb.parse_and_eval(p["name"])
            ptype = pval.type
        except Exception:
            continue
        fields_t, target_t = struct_ptr_field_types(pval)
        if not fields_t or target_t is None:
            continue
        # find pointer field that points back to same struct (e.g. next)
        next_field = None
        target_str = str(target_t)
        for fname, ftype in fields_t.items():
            ft = strip_type(ftype)
            if ft.code == gdb.TYPE_CODE_PTR and str(strip_type(ft.target())) == target_str:
                next_field = fname
                break
        if next_field is None:
            continue
        # find an int-like data field for label
        data_field = None
        for fname, ftype in fields_t.items():
            if fname == next_field:
                continue
            if is_int_like(strip_type(ftype)):
                data_field = fname
                break
        chain = []
        seen_addr = set()
        cur = p["target_addr"]
        while cur and cur not in seen_addr and len(chain) < 64:
            seen_addr.add(cur)
            try:
                node_val = gdb.Value(cur).cast(ptype).dereference()
            except Exception:
                try:
                    node_val = gdb.parse_and_eval("((%s)0x%x)" % (ptype, cur)).dereference()
                except Exception:
                    break
            node_fields = read_struct_fields(node_val)
            label = None
            if data_field and data_field in node_fields:
                label = node_fields[data_field].get("value")
            else:
                for k, v in node_fields.items():
                    if v.get("kind") == "int":
                        label = v.get("value")
                        break
            nxt = node_fields.get(next_field, {}).get("addr", 0)
            chain.append(
                {
                    "addr": "0x%x" % (cur & 0xFFFFFFFFFFFFFFFF),
                    "label": label,
                    "next": "0x%x" % ((nxt or 0) & 0xFFFFFFFFFFFFFFFF),
                    "fields": {k: v.get("value", v.get("addr")) for k, v in node_fields.items()},
                }
            )
            cur = nxt or 0
        if len(chain) >= 1:
            linked_lists.append({"head": p["name"], "nodes": chain, "next_field": next_field})

    try:
        line_text = CFG["source_lines"][line - 1] if 1 <= line <= len(CFG["source_lines"]) else ""
    except Exception:
        line_text = ""

    ev = {
        "step": step,
        "line": line,
        "line_text": line_text,
        "function": function,
        "stack": stack,
        "event": "step",
        "variables": variables,
        "arrays": arrays,
        "pointers": pointers,
        "memory": memory,
        "linked_lists": linked_lists,
        "stdout": cumulative_stdout(),
        "stdout_delta": read_stdout(),
    }
    events.append(ev)


def summarize_fields(fields):
    parts = []
    for k, v in list(fields.items())[:4]:
        if v.get("kind") == "int":
            parts.append("%s=%s" % (k, v.get("value")))
        elif v.get("kind") == "ptr":
            parts.append("%s=%s" % (k, v.get("addr")))
    return "{" + ", ".join(parts) + "}"


_ptr_type_cache = {}


def step_into_user_code():
    """Single-step; skip library frames so we stay in the user's source file."""
    for _ in range(64):
        try:
            gdb.execute("step", to_string=True)
        except gdb.error:
            return False
        try:
            fr = gdb.selected_frame()
        except gdb.error:
            return False
        if in_our_file(fr):
            return True
        # landed in a library: try finish to return to user code
        try:
            gdb.execute("finish", to_string=True)
        except gdb.error:
            return True
        try:
            fr = gdb.selected_frame()
        except gdb.error:
            return False
        if in_our_file(fr):
            return True
    return True


def main():
    global truncated
    gdb.execute("break main")
    try:
        gdb.execute('run > "%s" 2>&1' % STDOUT_FILE.replace("\\", "/"))
    except gdb.error:
        pass

    step = 0
    try:
        fr = gdb.selected_frame()
        if not in_our_file(fr):
            step_into_user_code()
    except gdb.error:
        # program exited immediately (no main breakpoint hit)
        try:
            read_stdout()
        except Exception:
            pass
        write_events()
        return

    while step < MAX_STEPS:
        try:
            gdb.selected_frame()
        except gdb.error:
            break
        capture(step)
        step += 1
        if step % 25 == 0:
            write_events()  # keep partial trace if the process is killed
        if not step_into_user_code():
            break
    else:
        truncated = True

    try:
        read_stdout()
    except Exception:
        pass
    write_events()


def write_events():
    with open(EVENTS_FILE, "w", encoding="utf-8") as f:
        json.dump({"events": events, "truncated": truncated}, f, ensure_ascii=False)


main()
