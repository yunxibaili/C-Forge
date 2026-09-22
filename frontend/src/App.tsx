import { useCallback, useEffect, useState } from "react";
import { EXAMPLES } from "./examples";
import { runCode } from "./api";
import type { RunResult } from "./types";
import Editor from "./components/Editor";
import Viz from "./components/Viz";
import Timeline from "./components/Timeline";
import styles from "./App.module.css";

export default function App() {
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [exampleId, setExampleId] = useState(EXAMPLES[0].id);
  const [result, setResult] = useState<RunResult | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const events = result?.events ?? [];
  const current = events.length ? events[Math.min(index, events.length - 1)] : null;

  const doRun = useCallback(async () => {
    setBusy(true);
    setError(null);
    setPlaying(false);
    try {
      const r = await runCode(code);
      if (!r.ok) {
        setResult(null);
        setError(r.compile_error || r.trace_error || "运行失败");
      } else if (!r.events.length) {
        setResult(null);
        setError(r.trace_error || "没有采集到执行步骤");
      } else {
        setResult(r);
        setIndex(0);
        setPlaying(true);
      }
    } catch (e) {
      setError("无法连接后端 (python main.py 是否已启动?): " + String(e));
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
    setExampleId(id);
    setCode(ex.code);
    setResult(null);
    setError(null);
    setIndex(0);
    setPlaying(false);
  };

  const status = busy
    ? "编译 + 追踪中…"
    : error
    ? "错误"
    : events.length
    ? `Step ${index + 1} / ${events.length}`
    : "就绪 · 写 C，点 RUN";

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.logo}>
          C<span className={styles.logoAccent}>-</span>FORGE
        </div>
        <select
          className={styles.exampleSelect}
          value={exampleId}
          onChange={(e) => loadExample(e.target.value)}
          title="加载示例"
        >
          {EXAMPLES.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
        <div className={styles.spacer} />
        <span className={styles.status + (busy ? " " + styles.statusBusy : "")}>{status}</span>
        <button className={styles.runBtn} onClick={doRun} disabled={busy}>
          {busy ? "⋯ RUN" : "▶ RUN"}
        </button>
        <button className={styles.btn} onClick={doNext} disabled={!events.length}>
          ⏭ STEP
        </button>
        <button className={styles.btn} onClick={doReset} disabled={!events.length}>
          ⟲ RESET
        </button>
      </header>

      <div className={styles.body}>
        <div className={styles.editorPane}>
          <Editor code={code} onChange={setCode} activeLine={current?.line ?? 0} />
        </div>
        <div className={styles.vizPane}>
          {error && <div className={styles.errorBanner}>{error}</div>}
          <Viz result={result} index={index} />
        </div>
      </div>

      <Timeline
        total={events.length}
        index={index}
        event={current}
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
