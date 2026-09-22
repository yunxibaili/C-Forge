import { useState } from "react";
import type { TraceEvent } from "../types";
import styles from "./Timeline.module.css";

const EVENT_COLORS: Record<string, string> = {
  start: "#9a9aa4",
  step: "#6b6b74",
  write: "#0891b2",
  array_write: "#0891b2",
  swap: "#d97706",
  swap_step: "#b45309",
  compare: "#d97706",
  pointer_move: "#0e7490",
  call: "#4f46e5",
  return: "#6366f1",
};

interface Props {
  total: number;
  index: number;
  events: TraceEvent[];
  playing: boolean;
  onScrub: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onPlay: () => void;
  onReset: () => void;
}

function tipFor(ev: TraceEvent | null, idx: number): string {
  if (!ev) return "";
  let s = `Step ${idx + 1}  ·  L${ev.line}  ·  ${ev.event}`;
  if (ev.swap) s += `  ·  a[${ev.swap.i}] ↔ a[${ev.swap.j}]`;
  return s;
}

export default function Timeline({
  total,
  index,
  events,
  playing,
  onScrub,
  onPrev,
  onNext,
  onPlay,
  onReset,
}: Props) {
  const pct = total > 1 ? (index / (total - 1)) * 100 : 0;
  const [hoverPct, setHoverPct] = useState<number | null>(null);

  const hoverIdx =
    hoverPct !== null && total > 1
      ? Math.max(0, Math.min(total - 1, Math.round((hoverPct / 100) * (total - 1))))
      : null;

  return (
    <div className={styles.bar}>
      <div className={styles.transport}>
        <button className={styles.tbtn} onClick={onReset} disabled={!total} title="Start">⏮</button>
        <button className={styles.tbtn} onClick={onPrev} disabled={!total || index <= 0} title="Prev">◀</button>
        <button
          className={`${styles.tbtn} ${playing ? styles.tbtnActive : ""}`}
          onClick={onPlay}
          disabled={!total || index >= total - 1}
          title="Play / pause"
        >{playing ? "⏸" : "▶"}</button>
        <button className={styles.tbtn} onClick={onNext} disabled={!total || index >= total - 1} title="Next">▶</button>
      </div>

      <div
        className={styles.trackArea}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHoverPct(((e.clientX - r.left) / r.width) * 100);
        }}
        onMouseLeave={() => setHoverPct(null)}
      >
        <div className={styles.track}>
          <div className={styles.ticks}>
            {events.slice(0, 800).map((e, i) => (
              <span
                key={i}
                className={i === index ? `${styles.tick} ${styles.tickActive}` : styles.tick}
                style={{
                  left: `${total > 1 ? (i / (total - 1)) * 100 : 0}%`,
                  background: i === index ? "#ffffff" : EVENT_COLORS[e.event] || "#9a9aa4",
                }}
              />
            ))}
          </div>
          <div className={styles.progress} style={{ width: `${pct}%` }} />
          <div className={styles.thumb} style={{ left: `${pct}%` }} />
          <input
            className={styles.range}
            type="range"
            min={0}
            max={Math.max(0, total - 1)}
            value={index}
            disabled={!total}
            onChange={(e) => onScrub(parseInt(e.target.value, 10))}
            aria-label="Timeline"
          />
        </div>
        <div className={styles.scale}>
          <span>0</span>
          <span>{total || "—"}</span>
        </div>

        {hoverIdx !== null && (
          <div
            className={styles.tooltip}
            style={{
              left: `calc(${total > 1 ? (hoverIdx / (total - 1)) * 100 : 0}% )`,
              transform: hoverPct !== null && hoverPct > 80 ? "translateX(-100%)" : "translateX(0)",
            }}
          >
            {tipFor(events[hoverIdx], hoverIdx)}
          </div>
        )}
      </div>

      <div className={styles.readout}>
        {total ? `${index + 1} / ${total}` : "— / —"}
      </div>
    </div>
  );
}
