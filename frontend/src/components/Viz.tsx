import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ArrayInfo,
  LinkedList,
  PointerInfo,
  RunResult,
  TraceEvent,
  VarMeta,
} from "../types";
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

function varChanged(a?: VarMeta, b?: VarMeta): boolean {
  if (!a || !b) return false;
  return JSON.stringify(a.value ?? a.fields) !== JSON.stringify(b.value ?? b.fields);
}

function pickPrimaryList(ev: TraceEvent | null): LinkedList | null {
  if (!ev || !ev.linked_lists.length) return null;
  const lists = ev.linked_lists.filter((l) => l.nodes.length > 0);
  if (!lists.length) return null;
  const headList = lists.find((l) => l.head === "head" || l.head === "first");
  if (headList) return headList;
  return lists.reduce((a, b) => (b.nodes.length > a.nodes.length ? b : a));
}

/** resolve indices compared in line like: if (a[j] > a[j + 1]) */
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

const ROW_H = 64;
const BOX_W = 210;
const BOX_X = 16;
const RIGHT_EDGE = BOX_X + BOX_W;

function elbowPath(x1: number, y1: number, x2: number, y2: number, bx: number): string {
  const dy = y2 - y1;
  if (Math.abs(dy) < 2) return `M ${x1} ${y1} L ${x2} ${y2}`;
  const r = Math.min(12, Math.abs(dy) / 2, Math.abs(bx - x1));
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
      const k = Math.min(1, (t - start) / 340);
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
      strokeWidth={2}
      markerEnd="url(#arrowhead)"
      style={{ stroke: color }}
    />
  );
}

/* append-only layout slots so boxes never jump */
function boxData(
  name: string,
  ev: TraceEvent
): { kind: "ptr" | "array" | "var"; label: string; sub: string } {
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

/* append-only slots: stable positions across the whole run */
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

  if (!shown.length) {
    return <div className={styles.emptyHint}>等待变量出现 —— 点 ▶ RUN 开始</div>;
  }

  const height = order.length * ROW_H + 48;
  const centerY = (i: number) => 28 + i * ROW_H + ROW_H / 2;

  const arrows = ev.pointers
    .map((p, i) => {
      if (p.null || !p.target || !(p.target in slot)) return null;
      return {
        id: p.name,
        y1: centerY(slot[p.name]),
        y2: centerY(slot[p.target]),
        bx: RIGHT_EDGE + 40 + i * 22,
        color: "#a78bfa",
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
      viewBox={`0 0 560 ${height}`}
      preserveAspectRatio="xMinYMin meet"
      style={{ height: Math.max(220, height) }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#a78bfa" />
        </marker>
      </defs>
      {arrows.map((a) => (
        <ArrowLine key={a.id} y1={a.y1} y2={a.y2} bx={a.bx} color={a.color} />
      ))}
      {shown.map((name) => {
        const i = slot[name];
        const b = boxData(name, ev);
        const y = 28 + i * ROW_H;
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
        // array cell target highlight
        const tgtIdx = targeted && targeted.target_index != null ? targeted.target_index : null;
        return (
          <g key={name} transform={`translate(${BOX_X}, ${y})`} className={styles.boxG}>
            <rect
              className={cls}
              width={BOX_W}
              height={ROW_H - 12}
              rx={8}
            />
            <text x={12} y={22} className={styles.boxName}>
              {b.label}
            </text>
            <text x={12} y={40} className={styles.boxVal}>
              {b.sub}
              {b.kind === "array" && tgtIdx != null ? (
                <tspan className={styles.tgtCell} dx={6}>
                  ⌖[{tgtIdx}]
                </tspan>
              ) : null}
            </text>
            {b.kind === "ptr" && (
              <circle cx={BOX_W} cy={(ROW_H - 12) / 2} r={3.5} fill="#a78bfa" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- array strip ---------- */

/** indices referenced by a comparison like a[j] > a[j + 1] — regardless of event class */
function comparisonIndices(line: string, ev: TraceEvent, arrName: string): number[] {
  if (!new RegExp(`${arrName}\\[[^\\]]+\\]\\s*[<>]=?\\s*${arrName}\\[`).test(line)) return [];
  return compareIndices(line, ev, arrName);
}

function ArrayStrip({ ev, prev }: { ev: TraceEvent; prev: TraceEvent | null }) {
  if (!ev.arrays.length) return null;
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>数组 / 内存</div>
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
        return (
          <div key={arr.name} className={styles.arrBlock}>
            <div className={styles.arrHead}>
              <span className={styles.arrName}>
                {arr.name}[{arr.length}]
              </span>
              <span className={styles.arrMeta}>
                {arr.type} · base {arr.addr ?? "?"} · {arr.elem_size}B/cell
              </span>
            </div>
            <div className={styles.arrRow}>
              {arr.elems.map((v, i) => {
                let cls = styles.cell;
                if (swap && (i === swap.i || i === swap.j)) cls += " " + styles.cellSwap;
                else if (cmp.includes(i)) cls += " " + styles.cellCmp;
                else if (changedIdx.has(i)) cls += " " + styles.cellWrite;
                return (
                  <div key={i} className={cls}>
                    <div className={styles.cellVal}>{v === null ? "?" : v}</div>
                    <div className={styles.cellIdx}>[{i}]</div>
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
      {ev.arrays.some((a) => comparisonIndices(ev.line_text, ev, a.name).length > 0) && (
        <div className={styles.cmpNote}>▲ 高亮单元格正在比较</div>
      )}
    </div>
  );
}

/* ---------- linked list ---------- */

const NODE_W = 92;
const NODE_H = 56;
const NODE_GAP = 56;

function LinkedListView({ ev }: { ev: TraceEvent }) {
  const primary = pickPrimaryList(ev);
  if (!primary) return null;
  const highlight = new Set<string>();
  ev.linked_lists.forEach((l) => {
    if (l !== primary && l.nodes.length) highlight.add(l.nodes[0].addr);
  });
  const width = Math.max(560, 40 + primary.nodes.length * (NODE_W + NODE_GAP));
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>
        链表 · {primary.head}
        <span className={styles.sectionSub}>{primary.nodes.length} nodes · {primary.next_field}</span>
      </div>
      <svg
        className={styles.listSvg}
        viewBox={`0 0 ${width} ${NODE_H + 60}`}
        style={{ height: NODE_H + 60, width }}
      >
        <defs>
          <marker id="llhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#4fd1c5" />
          </marker>
        </defs>
        <text x={4} y={14} className={styles.headLabel}>
          head
        </text>
        {primary.nodes.map((n, i) => {
          const x = 4 + i * (NODE_W + NODE_GAP);
          const isCur = highlight.has(n.addr);
          return (
            <g
              key={n.addr}
              transform={`translate(${x}, 24)`}
              className={styles.nodeG + (isCur ? " " + styles.nodeCur : "")}
            >
              <rect
                className={styles.nodeRect + (isCur ? " " + styles.nodeRectCur : "")}
                width={NODE_W}
                height={NODE_H}
                rx={10}
              />
              <text x={16} y={34} className={styles.nodeLabel}>
                {n.label === null || n.label === undefined ? "?" : n.label}
              </text>
              <circle cx={NODE_W} cy={NODE_H / 2} r={4} fill="#4fd1c5" />
              {i < primary.nodes.length - 1 && (
                <line
                  x1={NODE_W + 4}
                  y1={NODE_H / 2}
                  x2={NODE_W + NODE_GAP - 10}
                  y2={NODE_H / 2}
                  stroke="#4fd1c5"
                  strokeWidth={2}
                  markerEnd="url(#llhead)"
                />
              )}
              <text x={NODE_W + 8} y={NODE_H / 2 - 10} className={styles.nextLabel}>
                {primary.next_field}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- variables / stack / stats ---------- */

function VariablesPanel({ ev, prev }: { ev: TraceEvent; prev: TraceEvent | null }) {
  const rows: { name: string; meta: VarMeta }[] = Object.entries(ev.variables).map(
    ([name, meta]) => ({ name, meta })
  );
  const ptrRows = ev.pointers.filter((p) => !ev.variables[p.name]);
  return (
    <div className={styles.sideCard}>
      <div className={styles.sideTitle}>变量</div>
      {rows.length === 0 && ptrRows.length === 0 && (
        <div className={styles.emptySmall}>暂无变量</div>
      )}
      {rows.map(({ name, meta }) => {
        const changed = varChanged(prev?.variables[name], meta);
        return (
          <div
            key={`${name}@${changed ? ev.step : "s"}`}
            className={styles.varRow + (changed ? " " + styles.varFlash : "")}
          >
            <span className={styles.varName}>{name}</span>
            <span className={styles.varType}>{meta.type}</span>
            <span className={styles.varVal}>{fmtVar(meta)}</span>
          </div>
        );
      })}
      {ptrRows.map((p) => {
        const prevP = prev?.pointers.find((x) => x.name === p.name);
        const changed = !!prevP && prevP.value !== p.value;
        return (
          <div
            key={`${p.name}@${changed ? ev.step : "s"}`}
            className={styles.varRow + (changed ? " " + styles.varFlash : "")}
          >
            <span className={styles.varName}>*{p.name}</span>
            <span className={styles.varType}>ptr</span>
            <span className={styles.varVal}>
              {p.null ? "NULL" : p.target ? `→ ${p.target}` : p.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StackPanel({ ev }: { ev: TraceEvent }) {
  return (
    <div className={styles.sideCard}>
      <div className={styles.sideTitle}>调用栈</div>
      <div className={styles.stackList}>
        {ev.stack.map((fn, i) => (
          <div
            key={fn + i}
            className={styles.stackFrame + (i === 0 ? " " + styles.stackCurrent : "")}
          >
            {i === 0 ? "▶ " : "  "}
            {fn}()
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsPanel({ ev, result }: { ev: TraceEvent; result: RunResult }) {
  const st = ev.stats ?? { comparisons: 0, swaps: 0, visits: 0 };
  const hasMid = "mid" in ev.variables;
  let complexity = "";
  if (hasMid && st.comparisons > 0) complexity = "二分查找 · O(log n)";
  else if (st.swaps > 0 || (result.stats?.swaps ?? 0) > 0)
    complexity = "交换类排序 · Best O(n) / Avg O(n²) / Worst O(n²)";
  else if (st.comparisons > 0) complexity = "比较驱动 · 见算法本身";
  return (
    <div className={styles.statsBar}>
      <span className={styles.chip}>⇄ 比较 {st.comparisons}</span>
      <span className={styles.chipChipOrange}>⇅ 交换 {st.swaps}</span>
      <span className={styles.chipChipBlue}>▦ 访问 {st.visits}</span>
      {complexity && <span className={styles.complexity}>{complexity}</span>}
      <span className={styles.eventBadge} data-ev={ev.event}>
        {ev.event}
      </span>
    </div>
  );
}

/* ---------- main viz ---------- */

export default function Viz({ result, index }: { result: RunResult | null; index: number }) {
  const stdoutRef = useRef<HTMLPreElement | null>(null);
  const events = result?.events ?? [];
  const i = Math.min(index, Math.max(0, events.length - 1));
  const ev = events.length ? events[i] : null;
  const prev = ev && i > 0 ? events[i - 1] : null;
  const { order, slot } = useMemo(
    () => buildSlots(events, i),
    [events, i]
  );

  useEffect(() => {
    const el = stdoutRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ev?.stdout]);

  if (!ev) {
    return (
      <div className={styles.wrap}>
        <div className={styles.idle}>
          <div className={styles.idleLogo}>▶</div>
          <div>写一段 C，点右上角 RUN</div>
          <div className={styles.idleSub}>代码会被真实编译执行，过程逐步动画回放</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <StatsPanel ev={ev} result={result!} />
      <div className={styles.cols}>
        <div className={styles.mainCol}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              内存 / 指针关系
              <span className={styles.sectionSub}>
                {ev.function} · L{ev.line}
              </span>
            </div>
            <PointerMap ev={ev} prev={prev} order={order} slot={slot} />
          </div>
          <ArrayStrip ev={ev} prev={prev} />
          <LinkedListView ev={ev} />
        </div>
        <div className={styles.sideCol}>
          <VariablesPanel ev={ev} prev={prev} />
          <StackPanel ev={ev} />
          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>STDOUT</div>
            <pre ref={stdoutRef} className={styles.stdout}>
              {ev.stdout || <span className={styles.emptySmall}>(空)</span>}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
