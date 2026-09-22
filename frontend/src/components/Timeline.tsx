import { useState } from "react";
import type { TraceEvent } from "../types";
import styles from "./Timeline.module.css";

const EVENT_COLORS: Record<string, string> = {
  start: "#3a3a44",
  step: "#4a4a55",
  write: "#67e8f9",
  array_write: "#67e8f9",
  swap: "#fbbf24",
  swap_step: "#d97706",
  compare: "#fbbf24",
  pointer_move: "#22d3ee",
  call: "#8b93c7",
  return: "#6b7394",
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

function tipFor(ev: TraceEvent | null, idx: number): string {
  if (!ev) return "";
  let s = `Step ${idx + 1}  ·  L${ev.line}  ·  ${ev.event}`;
  if (ev.swap) s += `  ·  a[${ev.swap.i}] ↔ a[${ev.swap.j}]`;
  return s;
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
                  background: i === index ? "#e4e4e8" : EVENT_COLORS[e.event] || "#3a3a44",
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
