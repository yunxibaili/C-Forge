import { useEffect, useMemo, useRef, useState } from "react";
import type {
  LinkedList,
  PointerInfo,
  RunResult,
  StackFrameView,
  TraceEvent,
  VarMeta,
} from "../types";
import { buildFrames, splitVars } from "../frames";
import styles from "./Viz.module.css";

/* ---------- helpers ---------- */

function fmtVar(v: VarMeta): string {
  if (v.fields) {
    const parts: string[] = [];
    for (const [k, val] of Object.entries(v.fields)) {
      const m = val as { kind?: string; value?: unknown; addr?: number };
      if (m && m.kind === "int") parts.push(`${k}=${m.value}`);
      else if (m && m.kind === "ptr") parts.push(`${k}=0x${Number(m.addr || 0).toString(16)}`);
      else parts.push(`${k}=?`);
    }
    return `{ ${parts.join(", ")} }`;
  }
  if (v.value === null || v.value === undefined) return "—";
  return String(v.value);
}

function pickPrimaryList(ev: TraceEvent | null): LinkedList | null {
  if (!ev || !ev.linked_lists.length) return null;
  const lists = ev.linked_lists.filter((l) => l.nodes.length > 0);
  if (!lists.length) return null;
  const headList = lists.find((l) => l.head === "head" || l.head === "first");
  if (headList) return headList;
  return lists.reduce((a, b) => (b.nodes.length > a.nodes.length ? b : a));
}

function compareIndices(line: string, ev: TraceEvent, arrName: string): number[] {
  const re = new RegExp(`${arrName}\\[([^\\]]+)\\]`, "g");
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const expr = m[1].replace(/\s+/g, "");
    let idx: number | null = null;
    if (/^-?\d+$/.test(expr)) idx = parseInt(expr, 10);
    else {
      const mm = expr.match(/^([A-Za-z_]\w*)([+-]\d+)?$/);
      if (mm) {
        const v = ev.variables[mm[1]];
        if (v && typeof v.value === "number") {
          idx = v.value + (mm[2] ? parseInt(mm[2], 10) : 0);
        }
      }
    }
    if (idx !== null) out.push(idx);
    if (out.length >= 2) break;
  }
  return out;
}

function comparisonIndices(line: string, ev: TraceEvent, arrName: string): number[] {
  if (!new RegExp(`${arrName}\\[[^\\]]+\\]\\s*[<>]=?\\s*${arrName}\\[`).test(line)) return [];
  return compareIndices(line, ev, arrName);
}

/* ── pointer map geometry ── */
const ROW_H = 64;
const BOX_W = 220;
const BOX_X = 16;
const RIGHT_EDGE = BOX_X + BOX_W;

function elbowPath(x1: number, y1: number, x2: number, y2: number, bx: number): string {
  const dy = y2 - y1;
  if (Math.abs(dy) < 2) return `M ${x1} ${y1} L ${x2} ${y2}`;
  const r = Math.min(14, Math.abs(dy) / 2, Math.abs(bx - x1));
  const s = Math.sign(dy);
  return (
    `M ${x1} ${y1} L ${bx - r} ${y1} ` +
    `Q ${bx} ${y1} ${bx} ${y1 + s * r} ` +
    `L ${bx} ${y2 - s * r} ` +
    `Q ${bx} ${y2} ${bx - r} ${y2} ` +
    `L ${x2} ${y2}`
  );
}

function ArrowLine({ y1, y2, bx, color }: { y1: number; y2: number; bx: number; color: string }) {
  const [cur, setCur] = useState({ y1, y2 });
  const curRef = useRef(cur);
  curRef.current = cur;

  useEffect(() => {
    const a = curRef.current;
    if (Math.abs(a.y1 - y1) < 0.5 && Math.abs(a.y2 - y2) < 0.5) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 380);
      const e = 1 - Math.pow(1 - k, 3);
      setCur({ y1: a.y1 + (y1 - a.y1) * e, y2: a.y2 + (y2 - a.y2) * e });
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [y1, y2]);

  const d = elbowPath(RIGHT_EDGE, cur.y1, RIGHT_EDGE, cur.y2, bx);
  return (
    <path
      className={styles.arrowPath}
      d={d}
      stroke={color}
      fill="none"
      strokeWidth={1.5}
      markerEnd="url(#ah)"
      style={{ stroke: color }}
    />
  );
}

function boxData(name: string, ev: TraceEvent): { kind: "ptr" | "array" | "var"; label: string; sub: string } {
  const p = ev.pointers.find((x) => x.name === name);
  if (p) {
    const targetDesc = p.null
      ? "NULL"
      : p.target
      ? `→ ${p.target}${p.target_index != null ? `[${p.target_index}]` : ""}`
      : `→ 0x${p.target_addr.toString(16)}`;
    return { kind: "ptr", label: `*${name}`, sub: targetDesc };
  }
  const a = ev.arrays.find((x) => x.name === name);
  if (a) {
    return {
      kind: "array",
      label: `${name}[${a.length}]`,
      sub: `{ ${a.elems.slice(0, 8).map((x) => (x === null ? "?" : x)).join(", ")}${a.length > 8 ? " …" : ""} }`,
    };
  }
  const v = ev.variables[name];
  return { kind: "var", label: name, sub: v ? fmtVar(v) : "" };
}

function buildSlots(events: TraceEvent[], index: number) {
  const order: string[] = [];
  const slot: Record<string, number> = {};
  const add = (name: string) => {
    if (!(name in slot)) {
      slot[name] = order.length;
      order.push(name);
    }
  };
  for (let i = 0; i <= index && i < events.length; i++) {
    const ev = events[i];
    Object.keys(ev.variables || {}).forEach(add);
    (ev.arrays || []).forEach((a) => add(a.name));
    (ev.pointers || []).forEach((p) => add(p.name));
  }
  return { order, slot };
}

/* ── Pointer map ── */
function PointerMap({
  ev,
  prev,
  order,
  slot,
}: {
  ev: TraceEvent;
  prev: TraceEvent | null;
  order: string[];
  slot: Record<string, number>;
}) {
  const visible = new Set<string>([
    ...Object.keys(ev.variables || {}),
    ...(ev.arrays || []).map((a) => a.name),
    ...(ev.pointers || []).map((p) => p.name),
  ]);
  const shown = order.filter((n) => visible.has(n));
  if (!shown.length) return null;

  const height = order.length * ROW_H + 40;
  const centerY = (i: number) => 24 + i * ROW_H + ROW_H / 2;

  const arrows = ev.pointers
    .map((p, i) => {
      if (p.null || !p.target || !(p.target in slot)) return null;
      const color = ev.event === "write" && p.name === "p" ? "#b45309" : "#0e7490";
      return {
        id: p.name,
        y1: centerY(slot[p.name]),
        y2: centerY(slot[p.target]),
        bx: RIGHT_EDGE + 36 + i * 20,
        color,
      };
    })
    .filter(Boolean) as { id: string; y1: number; y2: number; bx: number; color: string }[];

  const prevVals: Record<string, unknown> = {};
  if (prev) {
    Object.entries(prev.variables).forEach(([k, v]) => (prevVals[k] = v.value ?? v.fields));
    prev.pointers.forEach((p) => (prevVals[p.name] = p.value));
    prev.arrays.forEach((a) => (prevVals[a.name] = a.elems.join(",")));
  }

  const pointerTargets = new Map<string, PointerInfo>();
  ev.pointers.forEach((p) => {
    if (!p.null && p.target) pointerTargets.set(p.target, p);
  });

  return (
    <svg
      className={styles.mapSvg}
      viewBox={`0 0 620 ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ height: Math.max(200, height) }}
    >
      <defs>
        <marker id="ah" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 z" fill="#0e7490" />
        </marker>
      </defs>
      {arrows.map((a) => (
        <ArrowLine key={a.id} y1={a.y1} y2={a.y2} bx={a.bx} color={a.color} />
      ))}
      {shown.map((name) => {
        const i = slot[name];
        const b = boxData(name, ev);
        const y = 24 + i * ROW_H;
        const changed =
          name in prevVals &&
          JSON.stringify(prevVals[name]) !==
            JSON.stringify(
              ev.variables[name]?.value ??
                ev.variables[name]?.fields ??
                ev.pointers.find((p) => p.name === name)?.value ??
                ev.arrays.find((a) => a.name === name)?.elems.join(",")
            );
        const targeted = pointerTargets.get(name);
        let cls = styles.box;
        if (b.kind === "ptr") cls += " " + styles.boxPtr;
        else if (b.kind === "array") cls += " " + styles.boxArr;
        if (changed) cls += " " + styles.boxFlash;
        const tgtIdx = targeted && targeted.target_index != null ? targeted.target_index : null;
        return (
          <g
            key={name}
            style={{ transform: `translate(${BOX_X}px, ${y}px)` }}
            className={styles.boxG}
          >
            <rect className={cls} width={BOX_W} height={ROW_H - 14} rx={4} />
            <text x={14} y={24} className={styles.boxName}>{b.label}</text>
            <text x={14} y={42} className={styles.boxVal}>
              {b.sub}
              {b.kind === "array" && tgtIdx != null ? (
                <tspan className={styles.tgtCell} dx={6}>⌖[{tgtIdx}]</tspan>
              ) : null}
            </text>
            {b.kind === "ptr" && (
              <circle cx={BOX_W} cy={(ROW_H - 14) / 2} r={3} fill="#0e7490" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Array memory cells ── */
function ArrayStrip({ ev, prev }: { ev: TraceEvent; prev: TraceEvent | null }) {
  if (!ev.arrays.length) return null;

  return (
    <div className={styles.arrBlock}>
      {ev.arrays.map((arr) => {
        const prevArr = prev?.arrays.find((a) => a.name === arr.name);
        const cmp = comparisonIndices(ev.line_text, ev, arr.name);
        const swap = ev.event === "swap" && ev.swap?.array === arr.name ? ev.swap : null;
        const changedIdx = new Set<number>();
        if (prevArr) {
          arr.elems.forEach((v, i) => {
            if (prevArr.elems[i] !== v) changedIdx.add(i);
          });
        }
        const base = arr.addr ? parseInt(arr.addr, 16) : 0;
        const pitch = 72; // cell width

        return (
          <div key={arr.name} className={styles.arrBlock} style={{ width: "100%", alignItems: "center" }}>
            <div className={styles.arrHead}>
              <span className={styles.arrName}>{arr.name}[{arr.length}]</span>
              <span className={styles.arrMeta}>
                {arr.type} · base {arr.addr ?? "?"} · {arr.elem_size}B
              </span>
            </div>
            <div className={styles.arrRow}>
              {arr.elems.map((v, i) => {
                let cls = styles.cell;
                let fromPx = "0px";
                let valKey = `${i}-${ev.step}`;

                if (swap && (i === swap.i || i === swap.j)) {
                  cls += " " + styles.cellSwap;
                  // value at i came from j (and vice versa): cross-in from opposite side
                  fromPx = `${(i < swap.j ? 1 : -1) * Math.abs(swap.j - swap.i) * pitch}px`;
                  cls += " " + styles.cellSwapIn;
                } else if (cmp.includes(i)) {
                  cls += " " + styles.cellCmp;
                } else if (changedIdx.has(i)) {
                  cls += " " + styles.cellWrite;
                } else {
                  valKey = String(i); // stable for non-highlighted cells
                }

                return (
                  <div
                    key={valKey}
                    className={cls}
                    style={swap && (i === swap.i || i === swap.j) ? ({ ["--from" as string]: fromPx } as React.CSSProperties) : undefined}
                  >
                    <div className={styles.cellIdx}>{i}</div>
                    <div className={styles.cellVal}>{v === null ? "?" : v}</div>
                    <div className={styles.cellAddr}>
                      {base ? "0x" + (base + i * (arr.elem_size || 4)).toString(16) : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Linked list ── */
const NODE_W = 96;
const NODE_H = 54;
const NODE_GAP = 64;

function LinkedListView({ ev, prev }: { ev: TraceEvent; prev: TraceEvent | null }) {
  const primary = pickPrimaryList(ev);
  if (!primary) return null;
  const prevList = prev ? pickPrimaryList(prev) : null;

  const highlight = new Set<string>();
  ev.linked_lists.forEach((l) => {
    if (l !== primary && l.nodes.length) highlight.add(l.nodes[0].addr);
  });

  const prevAddrs = new Set((prevList?.nodes ?? []).map((n) => n.addr));
  const width = Math.max(480, 40 + primary.nodes.length * (NODE_W + NODE_GAP));

  return (
    <svg
      className={styles.listSvg}
      viewBox={`0 0 ${width} ${NODE_H + 56}`}
      style={{ width, height: NODE_H + 56 }}
    >
      <defs>
        <marker id="llh" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 z" fill="#0e7490" />
        </marker>
      </defs>
      <text x={4} y={14} className={styles.headLabel}>HEAD</text>
      {primary.nodes.map((n, i) => {
        const x = 4 + i * (NODE_W + NODE_GAP);
        const isCur = highlight.has(n.addr);
        const isNew = !prevAddrs.has(n.addr) && prevList !== null;
        return (
          <g
            key={n.addr}
            style={{ transform: `translate(${x}px, 24px)` }}
            className={`${styles.nodeG}${isNew ? " " + styles.nodeEnter : ""}`}
          >
            <rect
              className={`${styles.nodeRect}${isCur ? " " + styles.nodeRectCur : ""}`}
              width={NODE_W}
              height={NODE_H}
              rx={4}
            />
            <text x={NODE_W / 2} y={NODE_H / 2 + 6} textAnchor="middle" className={styles.nodeLabel}>
              {n.label === null || n.label === undefined ? "?" : n.label}
            </text>
            <text x={NODE_W / 2} y={NODE_H - 4} textAnchor="middle" className={styles.nodeAddr}>
              {n.addr.slice(0, 10)}
            </text>
            <circle cx={NODE_W} cy={NODE_H / 2} r={3} fill="#0e7490" />
          </g>
        );
      })}
      {/* arrows between nodes — keyed by pair so insert triggers draw-in */}
      {primary.nodes.slice(0, -1).map((_, i) => {
        const x1 = 4 + i * (NODE_W + NODE_GAP) + NODE_W;
        const y = 24 + NODE_H / 2;
        const key = `${primary.nodes[i].addr}->${primary.nodes[i + 1].addr}`;
        return (
          <line
            key={key}
            x1={x1 + 4}
            y1={y}
            x2={x1 + NODE_GAP - 8}
            y2={y}
            className={`${styles.linkLine} ${styles.linkDraw}`}
            markerEnd="url(#llh)"
          />
        );
      })}
    </svg>
  );
}

/* ── stack frames ── */
function ptrFor(f: StackFrameView, name: string): PointerInfo | undefined {
  return f.pointers.find((p) => p.name === name);
}

function StackFrames({
  frames,
  prevFrames,
  transition,
  popped,
  ev,
}: {
  frames: StackFrameView[];
  prevFrames: StackFrameView[];
  transition: "call" | "return" | "none";
  popped: StackFrameView[] | null;
  ev: TraceEvent;
}) {
  const prevIds = new Set(prevFrames.map((f) => f.id));
  const shown = [...frames].reverse();
  const popping = popped ?? [];

  return (
    <div className={styles.stackCol}>
      {popping.map((f) => (
        <div key={`pop-${f.id}`} className={`${styles.frameCard} ${styles.framePop}`}>
          <div className={styles.frameHead}>
            <span className={styles.frameName}>{f.name}()</span>
            <span className={styles.frameBadgePop}>return</span>
          </div>
          <div className={styles.frameRet}>← frame destroyed</div>
        </div>
      ))}
      {shown.map((f) => {
        const isNew = !prevIds.has(f.id) && transition === "call";
        const { params, locals } = splitVars(f.vars);
        let cls = styles.frameCard;
        if (f.isInnermost) cls += " " + styles.frameCur;
        if (isNew) cls += " " + styles.frameEnter;
        const ptrNames = new Set(f.pointers.map((p) => p.name));
        const retLabel =
          f.depth > 0
            ? `ret → ${frames[f.depth - 1]?.name ?? "caller"}`
            : "entry";

        return (
          <div key={f.id} className={cls}>
            <div className={styles.frameHead}>
              <span className={styles.frameName}>{f.name}()</span>
              <span className={styles.frameDepth}>depth {f.depth}</span>
              {f.isInnermost ? (
                <span className={styles.frameBadge}>active</span>
              ) : isNew ? (
                <span className={styles.frameBadgeCall}>CALL</span>
              ) : null}
            </div>
            {f.callLine != null && f.depth > 0 && (
              <div className={styles.frameCall}>called @ L{f.callLine}</div>
            )}
            {params.length > 0 && (
              <div className={styles.frameSec}>
                <div className={styles.frameSecLabel}>parameters</div>
                {params.map(([k, v]) => {
                  const p = ptrFor(f, k);
                  return (
                    <div key={k} className={`${styles.varRow}${p ? " " + styles.varPtr : ""}`}>
                      <span className={styles.varName}>{k}</span>
                      <span className={styles.varEq}>=</span>
                      <span className={styles.varVal}>
                        {p ? (p.null ? "NULL" : p.value) : fmtVar(v)}
                      </span>
                      {p && !p.null && (
                        <span className={styles.varArrow}>
                          → {p.target ?? `0x${p.target_addr.toString(16)}`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {locals.length > 0 && (
              <div className={styles.frameSec}>
                <div className={styles.frameSecLabel}>locals</div>
                {locals.map(([k, v]) => {
                  const p = ptrFor(f, k);
                  const moved = ev.event === "pointer_move" && f.isInnermost && ptrNames.has(k);
                  return (
                    <div
                      key={k}
                      className={`${styles.varRow}${p ? " " + styles.varPtr : ""}${moved ? " " + styles.varFlash : ""}`}
                    >
                      <span className={styles.varName}>{k}</span>
                      <span className={styles.varEq}>=</span>
                      <span className={styles.varVal}>
                        {p ? (p.null ? "NULL" : p.value) : fmtVar(v)}
                      </span>
                      {p && !p.null && (
                        <span className={styles.varArrow}>
                          → {p.target ?? `0x${p.target_addr.toString(16)}`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {params.length === 0 && locals.length === 0 && (
              <div className={styles.frameEmpty}>no symbols yet</div>
            )}
            <div className={styles.frameFoot}>
              <span className={styles.frameRet}>{retLabel}</span>
              {f.line != null && f.isInnermost && (
                <span className={styles.frameLine}>L{f.line}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── main viz ── */
export default function Viz({ result, index }: { result: RunResult | null; index: number }) {
  const events = result?.events ?? [];
  const i = Math.min(index, Math.max(0, events.length - 1));
  const ev = events.length ? events[i] : null;
  const prev = ev && i > 0 ? events[i - 1] : null;
  const { order, slot } = useMemo(() => buildSlots(events, i), [events, i]);
  const ft = useMemo(() => buildFrames(events, i), [events, i]);
  const ftPrev = useMemo(() => buildFrames(events, Math.max(0, i - 1)), [events, i]);

  if (!ev || !result) {
    return (
      <div className={styles.wrap}>
        <div className={styles.idle}>
          <div className={styles.idleLogo}>C<span>-</span>FORGE</div>
          <div className={styles.idleSub}>C / MEMORY / DATA STRUCTURES</div>
          <button className={styles.idleBtn} disabled onClick={() => {}}>Run</button>
          <div className={styles.idleHint}>Open an example or write C code to begin.</div>
        </div>
      </div>
    );
  }

  const st = ev.stats ?? { comparisons: 0, swaps: 0, visits: 0 };
  const isLast = i >= events.length - 1;
  const showSorted = isLast && st.swaps > 0;

  const hasPointerView =
    (ev.pointers.length > 0 || Object.keys(ev.variables).length > 0) && ev.linked_lists.length === 0;
  const hasArray = ev.arrays.length > 0;
  const hasList = ev.linked_lists.length > 0;
  const hasStack =
    ft.frames.length > 0 &&
    (ft.maxDepth > 1 || ft.frames.length > 1 || ft.lastTransition !== "none");

  const sections = [hasPointerView, hasArray, hasList, hasStack].filter(Boolean).length;

  return (
    <div className={styles.wrap}>
      <div className={styles.vizBar}>
        <span className={styles.vizLabel}>visualization</span>
        <span className={styles.vizMeta}>
          <span>{ev.function} · L{ev.line}</span>
          <span className={styles.statC}>COMPARE {st.comparisons}</span>
          <span className={styles.statS}>SWAP {st.swaps}</span>
          {ft.frames.length > 1 && (
            <span className={styles.stackDepthTag}>stack {ft.frames.length}</span>
          )}
          {showSorted && (
            <span className={styles.sorted}>
              SORTED · {st.swaps} swaps · {st.comparisons} comparisons
            </span>
          )}
        </span>
      </div>

      <div className={styles.stage}>
        {hasStack && (
          <div className={styles.stageBlock}>
            <span className={styles.stageTag}>
              call stack · {ft.frames.length} frame{ft.frames.length === 1 ? "" : "s"}
              {ft.lastTransition === "call" && " · CALL"}
              {ft.lastTransition === "return" && " · RETURN"}
            </span>
            <StackFrames
              frames={ft.frames}
              prevFrames={ftPrev.frames}
              transition={ft.lastTransition}
              popped={ft.popped}
              ev={ev}
            />
          </div>
        )}
        {hasPointerView && (
          <div className={styles.stageBlock}>
            <span className={styles.stageTag}>memory · pointers</span>
            <PointerMap ev={ev} prev={prev} order={order} slot={slot} />
          </div>
        )}
        {hasArray && (
          <div className={styles.stageBlock}>
            <span className={styles.stageTag}>array · memory cells</span>
            <ArrayStrip ev={ev} prev={prev} />
          </div>
        )}
        {hasList && (
          <div className={styles.stageBlock}>
            <span className={styles.stageTag}>
              linked list · {pickPrimaryList(ev)?.head} · {pickPrimaryList(ev)?.nodes.length} nodes
            </span>
            <LinkedListView ev={ev} prev={prev} />
          </div>
        )}
        {sections === 0 && (
          <div style={{ color: "var(--fg3)", fontFamily: "var(--mono)", fontSize: 13 }}>
            no visualization data for this step
          </div>
        )}
      </div>
    </div>
  );
}

