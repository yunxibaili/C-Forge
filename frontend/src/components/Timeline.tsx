import type { TraceEvent } from "../types";
import styles from "./Timeline.module.css";

const EVENT_COLORS: Record<string, string> = {
  start: "#64748b",
  step: "#475569",
  write: "#4fd1c5",
  array_write: "#4fd1c5",
  swap: "#f97316",
  swap_step: "#ea580c",
  compare: "#eab308",
  pointer_move: "#a78bfa",
  call: "#38bdf8",
  return: "#38bdf8",
};

interface Props {
  total: number;
  index: number;
  event: TraceEvent | null;
  events: TraceEvent[];
  playing: boolean;
  onScrub: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onPlay: () => void;
  onReset: () => void;
}

export default function Timeline({
  total,
  index,
  event,
  events,
  playing,
  onScrub,
  onPrev,
  onNext,
  onPlay,
  onReset,
}: Props) {
  const pct = total > 1 ? (index / (total - 1)) * 100 : 0;
  const label = event
    ? `Step ${index + 1}/${total} · L${event.line} · ${event.function}() · ${event.event}${
        event.swap ? ` [${event.swap.i} ⇄ ${event.swap.j}]` : ""
      }`
    : "未运行 —— 点 ▶ RUN";

  return (
    <div className={styles.bar}>
      <div className={styles.transport}>
        <button className={styles.tbtn} onClick={onReset} disabled={!total} title="回到起点">
          ⏮
        </button>
        <button
          className={styles.tbtn}
          onClick={onPrev}
          disabled={!total || index <= 0}
          title="上一步"
        >
          ◀
        </button>
        <button
          className={styles.tbtn + (playing ? " " + styles.tbtnActive : "")}
          onClick={onPlay}
          disabled={!total || index >= total - 1}
          title="播放 / 暂停"
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button
          className={styles.tbtn}
          onClick={onNext}
          disabled={!total || index >= total - 1}
          title="下一步"
        >
          ▶
        </button>
      </div>

      <div className={styles.trackArea}>
        <div className={styles.track}>
          <div className={styles.ticks}>
            {events.slice(0, 500).map((e, i) => (
              <span
                key={i}
                className={
                  styles.tick + (i === index ? " " + styles.tickActive : "")
                }
                style={{
                  left: `${total > 1 ? (i / (total - 1)) * 100 : 0}%`,
                  background: i === index ? "#e6edf3" : EVENT_COLORS[e.event] || "#334155",
                }}
              />
            ))}
          </div>
          <div className={styles.thumb} style={{ left: `${pct}%` }} />
          <input
            className={styles.range}
            type="range"
            min={0}
            max={Math.max(0, total - 1)}
            value={index}
            disabled={!total}
            onChange={(e) => onScrub(parseInt(e.target.value, 10))}
            aria-label="执行时间轴"
          />
        </div>
        <div className={styles.scale}>
          <span>1</span>
          <span>{total || "-"}</span>
        </div>
      </div>

      <div className={styles.label}>{label}</div>
    </div>
  );
}
