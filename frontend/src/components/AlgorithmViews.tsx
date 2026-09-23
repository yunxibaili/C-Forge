import type { AlgorithmEvent, AlgorithmStats } from "../algorithmEvents";

const CELL = 72;
const GAP = 4;

function Label({ text, color }: { text: string; color?: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--mono)",
        fontSize: 10,
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: color || "var(--fg3)",
      }}
    >
      {text}
    </span>
  );
}

/* ── Stack: vertical, top grows upward ── */
export function StackView({
  name,
  elems,
  top,
  activeEvent,
}: {
  name: string;
  elems: (number | string | null)[];
  top: number;
  activeEvent: AlgorithmEvent | null;
}) {
  const items = elems.slice(0, Math.max(top, 0));
  const height = Math.max(1, items.length) * 44 + 36;
  const highlightIdx =
    activeEvent && activeEvent.type !== "range"
      ? activeEvent.indices?.[0] ?? null
      : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Label text={`${name} · stack`} />
        <Label text={`top=${top}`} color="var(--cyan)" />
        {activeEvent && (
          <Label
            text={activeEvent.type.toUpperCase()}
            color={activeEvent.type === "push" ? "var(--cyan)" : activeEvent.type === "pop" ? "var(--amber)" : "var(--fg2)"}
          />
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column-reverse",
          alignItems: "stretch",
          minHeight: height,
          border: "1px solid var(--line2)",
          borderRadius: 6,
          padding: 6,
          background: "var(--bg1)",
          minWidth: 120,
        }}
      >
        {items.length === 0 && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--fg3)", padding: "12px 16px" }}>
            empty
          </div>
        )}
        {items.map((v, i) => {
          const isTop = i === top - 1;
          const hot = highlightIdx === i;
          const isNew = activeEvent?.type === "push" && activeEvent.stackTop === i + 1 && hot;
          return (
            <div
              key={`${i}-${v}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                margin: "2px 0",
                border: `1px solid ${hot ? "var(--cyan)" : "var(--line2)"}`,
                background: hot ? "rgba(8,145,178,0.10)" : "var(--bg0)",
                borderRadius: 4,
                fontFamily: "var(--mono)",
                fontSize: 16,
                fontWeight: 600,
                color: hot ? "var(--cyan)" : "var(--fg)",
                animation: isNew ? "cfPushIn 0.4s ease-out" : undefined,
                minWidth: 88,
              }}
            >
              <span style={{ fontSize: 10, color: "var(--fg3)", fontWeight: 400 }}>{i}</span>
              <span>{v === null ? "?" : v}</span>
              {isTop && (
                <span style={{ marginLeft: "auto", fontSize: 9, letterSpacing: 1, color: "var(--cyan)" }}>
                  TOP
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Queue: horizontal, front left, rear right ── */
export function QueueView({
  name,
  elems,
  front,
  rear,
  activeEvent,
}: {
  name: string;
  elems: (number | string | null)[];
  front: number;
  rear: number;
  activeEvent: AlgorithmEvent | null;
}) {
  const n = elems.length;
  const active: number[] = [];
  if (n > 0) {
    let i = front;
    let guard = 0;
    while (i !== rear && guard < n + 1) {
      active.push(i);
      i = (i + 1) % n;
      guard++;
    }
  }
  const hot = activeEvent?.indices?.[0] ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Label text={`${name} · queue`} />
        <Label text={`front=${front}`} color="var(--cyan)" />
        <Label text={`rear=${rear}`} color="var(--amber)" />
        {activeEvent && (
          <Label
            text={activeEvent.type.toUpperCase()}
            color={
              activeEvent.type === "enqueue"
                ? "var(--cyan)"
                : activeEvent.type === "dequeue"
                ? "var(--amber)"
                : "var(--fg2)"
            }
          />
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--cyan)", marginRight: 4 }}>
          front →
        </span>
        {elems.map((v, i) => {
          const inRange = active.includes(i);
          const isHot = hot === i;
          return (
            <div
              key={`${i}-${v}`}
              style={{
                width: CELL,
                height: 52,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${isHot ? "var(--cyan)" : inRange ? "var(--line2)" : "var(--line)"}`,
                background: isHot
                  ? "rgba(8,145,178,0.12)"
                  : inRange
                  ? "var(--bg1)"
                  : "var(--bg3)",
                opacity: inRange || isHot ? 1 : 0.45,
                borderRadius: 4,
                fontFamily: "var(--mono)",
                transition: "all 0.3s ease",
              }}
            >
              <span style={{ fontSize: 9, color: "var(--fg3)" }}>{i}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: inRange || isHot ? "var(--fg)" : "var(--fg3)" }}>
                {inRange || isHot ? (v === null ? "?" : v) : "—"}
              </span>
            </div>
          );
        })}
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--amber)", marginLeft: 4 }}>
          ← rear
        </span>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
        <Label text={`active ${active.length}`} />
        {activeEvent?.value != null && (
          <Label text={`value ${activeEvent.value}`} color="var(--fg2)" />
        )}
      </div>
    </div>
  );
}

/* ── Binary Search: array + low/mid/high markers ── */
export function BinarySearchView({
  name,
  elems,
  low,
  mid,
  high,
  activeEvent,
}: {
  name: string;
  elems: (number | string | null)[];
  low: number;
  mid: number;
  high: number;
  activeEvent: AlgorithmEvent | null;
}) {
  const cmpIdx = activeEvent?.type === "compare" ? activeEvent.indices?.[0] ?? mid : mid;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Label text={`${name} · binary search`} />
        <Label text={`L=${low}`} color="var(--cyan)" />
        <Label text={`M=${mid}`} color="var(--amber)" />
        <Label text={`R=${high}`} color="var(--violet)" />
        {activeEvent && (
          <Label
            text={activeEvent.type === "compare" ? `COMPARE a[${cmpIdx}]` : activeEvent.type.toUpperCase()}
            color="var(--fg2)"
          />
        )}
      </div>

      {/* markers row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${elems.length}, ${CELL}px)`,
          gap: GAP,
        }}
      >
        {elems.map((_, i) => {
          const inRange = i >= low && i <= high;
          const mark =
            i === low && i === high
              ? "L=M=R"
              : i === low
              ? "L"
              : i === mid
              ? "M"
              : i === high
              ? "R"
              : "";
          const color =
            i === mid
              ? "var(--amber)"
              : i === low
              ? "var(--cyan)"
              : i === high
              ? "var(--violet)"
              : "transparent";
          return (
            <div
              key={`mk-${i}`}
              style={{
                textAlign: "center",
                fontFamily: "var(--mono)",
                fontSize: 10,
                letterSpacing: 1,
                color,
                height: 16,
                opacity: inRange ? 1 : 0.3,
              }}
            >
              {mark}
            </div>
          );
        })}
      </div>

      {/* cells */}
      <div style={{ display: "flex", gap: GAP }}>
        {elems.map((v, i) => {
          const inRange = i >= low && i <= high;
          const isMid = i === cmpIdx;
          const isEdge = i === low || i === high;
          return (
            <div
              key={`${i}-${v}`}
              style={{
                width: CELL,
                height: 64,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${
                  isMid ? "var(--amber)" : isEdge && inRange ? "var(--cyan)" : inRange ? "var(--line2)" : "var(--line)"
                }`,
                background: isMid
                  ? "rgba(180,83,9,0.12)"
                  : inRange
                  ? "var(--bg1)"
                  : "var(--bg3)",
                borderRadius: 4,
                opacity: inRange ? 1 : 0.4,
                transition: "all 0.3s ease",
                fontFamily: "var(--mono)",
              }}
            >
              <span style={{ fontSize: 9, color: "var(--fg3)" }}>{i}</span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: isMid ? "var(--amber)" : inRange ? "var(--fg)" : "var(--fg3)",
                }}
              >
                {v === null ? "?" : v}
              </span>
            </div>
          );
        })}
      </div>

      {/* range bar */}
      <div
        style={{
          width: elems.length * (CELL + GAP),
          height: 4,
          background: "var(--bg3)",
          borderRadius: 2,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${(low / Math.max(1, elems.length)) * 100}%`,
            width: `${((high - low + 1) / Math.max(1, elems.length)) * 100}%`,
            height: "100%",
            background: "rgba(8,145,178,0.45)",
            transition: "all 0.35s ease",
          }}
        />
      </div>
      <Label text={`window [${low}..${high}] size ${Math.max(0, high - low + 1)}`} />
    </div>
  );
}

/* ── shared complexity strip ── */
export function ComplexityBar({ stats }: { stats: AlgorithmStats }) {
  const rows: [string, number][] = [
    ["comparisons", stats.comparisons],
    ["swaps", stats.swaps],
    ["writes", stats.writes],
    ["visits", stats.visits],
    ["pushes", stats.pushes],
    ["pops", stats.pops],
    ["enqueues", stats.enqueues],
    ["dequeues", stats.dequeues],
  ];
  const shown = rows.filter(([, n]) => n > 0);
  if (!shown.length) return null;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 14px",
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: "var(--fg3)",
        justifyContent: "center",
      }}
    >
      {shown.map(([k, n]) => (
        <span key={k}>
          {k} <b style={{ color: "var(--fg2)", fontWeight: 600 }}>{n}</b>
        </span>
      ))}
    </div>
  );
}
