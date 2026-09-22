import { useCallback, useEffect, useRef, useState } from "react";
import { EXAMPLES } from "../examples";
import { runCode } from "../api";
import type { RunResult } from "../types";
import Editor from "./Editor";
import Viz from "./Viz";
import Timeline from "./Timeline";
import styles from "../App.module.css";

function parseErrorLine(msg: string | null): number | null {
  if (!msg) return null;
  const m = msg.match(/program\.c:(\d+):\d+/);
  return m ? parseInt(m[1], 10) : null;
}

export interface WorkbenchProps {
  initialCode?: string;
  showExamples?: boolean;
  codeLabel?: string;
  onCodeChange?: (code: string) => void;
}

export default function Workbench({
  initialCode,
  showExamples = true,
  codeLabel = "main.c",
  onCodeChange,
}: WorkbenchProps) {
  const [code, setCode] = useState(initialCode ?? EXAMPLES[0].code);
  const [result, setResult] = useState<RunResult | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const onCodeChangeRef = useRef(onCodeChange);
  onCodeChangeRef.current = onCodeChange;

  useEffect(() => {
    onCodeChangeRef.current?.(code);
  }, [code]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const events = result?.events ?? [];
  const current = events.length ? events[Math.min(index, events.length - 1)] : null;
  const errorLine = parseErrorLine(error);
  const activeExampleId = EXAMPLES.find((e) => e.code === code)?.id ?? null;

  const doRun = useCallback(async () => {
    setBusy(true);
    setError(null);
    setPlaying(false);
    try {
      const r = await runCode(code);
      if (!r.ok) {
        setResult(null);
        setError(r.compile_error || r.trace_error || "run failed");
      } else if (!r.events.length) {
        setResult(null);
        setError(r.trace_error || "no events captured");
      } else {
        setResult(r);
        setIndex(0);
        setPlaying(true);
      }
    } catch (e) {
      setError("backend unreachable (python main.py?): " + String(e));
    } finally {
      setBusy(false);
    }
  }, [code]);

  const doNext = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.min(i + 1, Math.max(0, events.length - 1)));
  }, [events.length]);

  const doPrev = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const doReset = useCallback(() => {
    setPlaying(false);
    setIndex(0);
  }, []);

  const scrub = useCallback(
    (i: number) => {
      setPlaying(false);
      setIndex(Math.max(0, Math.min(i, events.length - 1)));
    },
    [events.length]
  );

  useEffect(() => {
    if (!playing || !events.length) return;
    if (index >= events.length - 1) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setIndex((i) => i + 1), 380);
    return () => window.clearTimeout(t);
  }, [playing, index, events.length]);

  const loadExample = (id: string) => {
    const ex = EXAMPLES.find((e) => e.id === id);
    if (!ex) return;
    setCode(ex.code);
    setResult(null);
    setError(null);
    setIndex(0);
    setPlaying(false);
    setMenuOpen(false);
  };

  let status = "READY";
  let statusKind = "idle";
  if (busy) {
    status = "RUNNING";
    statusKind = "busy";
  } else if (error) {
    status = "ERROR";
    statusKind = "err";
  } else if (events.length && index >= events.length - 1) {
    status = "EXIT 0";
    statusKind = "ok";
  } else if (events.length) {
    status = `STEP ${index + 1}/${events.length}`;
    statusKind = "step";
  }

  const controls = (
    <>
      <span
        data-status={statusKind}
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "1px",
          color:
            statusKind === "busy"
              ? "var(--amber)"
              : statusKind === "err"
              ? "var(--red)"
              : statusKind === "ok"
              ? "var(--cyan)"
              : statusKind === "step"
              ? "var(--fg)"
              : "var(--fg3)",
        }}
      >
        {status}
      </span>
      <div style={{ display: "flex", gap: 4 }}>
        {[
          { label: "▸ Run", fn: doRun, disabled: busy, title: "Compile & trace" },
          { label: "▷ Step", fn: doNext, disabled: !events.length, title: "Step forward" },
          { label: "↺ Reset", fn: doReset, disabled: !events.length, title: "Back to start" },
        ].map((b) => (
          <button
            key={b.label}
            onClick={b.fn}
            disabled={b.disabled}
            title={b.title}
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.5px",
              color: "var(--fg2)",
              padding: "5px 10px",
              borderRadius: "4px",
              transition: "color .15s, background .15s",
            }}
            onMouseEnter={(e) => {
              if (!b.disabled) {
                e.currentTarget.style.color = "var(--fg)";
                e.currentTarget.style.background = "rgba(0,0,0,0.05)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--fg2)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            {b.label}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className={styles.app}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 16px",
          background: "var(--bg1)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div style={{ flex: 1 }} />
        {controls}
      </header>

      <div className={styles.main}>
        <div className={styles.codePane}>
          <div className={styles.codeBar}>
            {showExamples ? (
              <div className={styles.exWrap} ref={menuRef}>
                <button className={styles.exBtn} onClick={() => setMenuOpen((o) => !o)}>
                  Examples ▾
                </button>
                {menuOpen && (
                  <div className={styles.exMenu}>
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex.id}
                        className={`${styles.exItem}${ex.id === activeExampleId ? " " + styles.exItemActive : ""}`}
                        onClick={() => loadExample(ex.id)}
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className={styles.codeFile}>{codeLabel}</span>
            )}
            {showExamples && <span className={styles.codeFile}>{codeLabel}</span>}
          </div>
          <div className={styles.editorHost}>
            <Editor
              code={code}
              onChange={setCode}
              activeLine={current?.line ?? 0}
              errorLine={errorLine}
            />
          </div>
        </div>

        <div className={styles.vizPane}>
          {error && <div className={styles.errorBanner}>{error}</div>}
          <Viz result={result} index={index} />
        </div>
      </div>

      <div className={styles.inspector}>
        <div className={styles.insCol}>
          <span className={styles.insLabel}>stdout</span>
          <pre
            className={`${styles.insBody} ${current?.stdout ? styles.stdoutText : styles.emptyDim}`}
          >
            {current?.stdout || "—"}
          </pre>
        </div>
        <div className={styles.insCol}>
          <span className={styles.insLabel}>call stack</span>
          <div className={styles.insBody}>
            {current ? (
              <div className={styles.stackList}>
                {current.stack.map((fn, i) => (
                  <div
                    key={fn + i}
                    className={`${styles.stackFrame}${i === 0 ? " " + styles.stackFrameCurrent : ""}`}
                  >
                    {i > 0 && <span className={styles.stackArrow}>↓</span>}
                    {fn}()
                  </div>
                ))}
              </div>
            ) : (
              <span className={styles.emptyDim}>—</span>
            )}
          </div>
        </div>
        <div className={styles.insCol}>
          <span className={styles.insLabel}>inspector</span>
          <div className={styles.insBody}>
            {current ? (
              <>
                <div className={styles.metaRow}>
                  <span className={styles.metaItem}>
                    step <b>{index + 1}/{events.length}</b>
                  </span>
                  <span className={styles.metaItem}>
                    line <b>{current.line}</b>
                  </span>
                  <span className={styles.metaItem}>
                    fn <b>{current.function}()</b>
                  </span>
                  <span className={styles.metaItem} style={{ color: "var(--cyan)" }}>
                    {current.event}
                  </span>
                  {current.swap && (
                    <span className={styles.metaItem} style={{ color: "var(--amber)" }}>
                      swap [{current.swap.i} ⇄ {current.swap.j}]
                    </span>
                  )}
                </div>
                <div className={`${styles.metaItem} ${styles.lineText}`}>{current.line_text}</div>
              </>
            ) : (
              <span className={styles.emptyDim}>—</span>
            )}
          </div>
        </div>
      </div>

      <Timeline
        total={events.length}
        index={index}
        events={events}
        playing={playing}
        onScrub={scrub}
        onPrev={doPrev}
        onNext={doNext}
        onPlay={() => setPlaying((p) => !p)}
        onReset={doReset}
      />
    </div>
  );
}
