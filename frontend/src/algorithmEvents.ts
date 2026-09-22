import type { ArrayInfo, TraceEvent } from "./types";

export type AlgorithmEventType =
  | "compare"
  | "swap"
  | "write"
  | "visit"
  | "push"
  | "pop"
  | "enqueue"
  | "dequeue"
  | "range";

export interface AlgorithmEvent {
  type: AlgorithmEventType;
  step: number;
  indices?: number[];
  value?: number | string | null;
  range?: { low: number; mid: number; high: number };
  stackTop?: number;
  queueFront?: number;
  queueRear?: number;
}

export interface AlgorithmStats {
  comparisons: number;
  swaps: number;
  writes: number;
  visits: number;
  pushes: number;
  pops: number;
  enqueues: number;
  dequeues: number;
}

export function emptyAlgorithmStats(): AlgorithmStats {
  return {
    comparisons: 0,
    swaps: 0,
    writes: 0,
    visits: 0,
    pushes: 0,
    pops: 0,
    enqueues: 0,
    dequeues: 0,
  };
}

function numVar(ev: TraceEvent, ...names: string[]): number | null {
  for (const n of names) {
    const v = ev.variables[n];
    if (v && typeof v.value === "number") return v.value;
  }
  return null;
}

function firstArray(ev: TraceEvent) {
  return ev.arrays.length ? ev.arrays[0] : null;
}

function hasPtr(ev: TraceEvent, ...names: string[]): boolean {
  return ev.pointers.some((p) => names.includes(p.name));
}

function resolveIndex(ev: TraceEvent, expr: string): number | null {
  const s = expr.replace(/\s+/g, "");
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  const m = s.match(/^([A-Za-z_]\w*)([+-]\d+)?$/);
  if (!m) return null;
  const v = ev.variables[m[1]];
  if (!v || typeof v.value !== "number") return null;
  return v.value + (m[2] ? parseInt(m[2], 10) : 0);
}

function compareIndicesFromLine(line: string, arrName: string, ev: TraceEvent): number[] {
  const re = new RegExp(`${arrName}\\[([^\\]]+)\\]`, "g");
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const idx = resolveIndex(ev, m[1]);
    if (idx !== null) out.push(idx);
    if (out.length >= 2) break;
  }
  return out;
}

function isCompareLine(line: string, arrName: string): boolean {
  return new RegExp(`${arrName}\\[[^\\]]+\\]\\s*[<>]=?|${arrName}\\[[^\\]]+\\]\\s*==`).test(line);
}

function topDeltaFromLine(line: string): number | null {
  const s = line.replace(/\s+/g, "");
  if (/\*(?:top|tp)\s*=\s*\*(?:top|tp)\s*\+\s*1/.test(s)) return 1;
  if (/\*(?:top|tp)\s*=\s*\*(?:top|tp)\s*-\s*1/.test(s)) return -1;
  if (/\(\*(?:top|tp)\)\+\+/.test(s) || /\+\+\(\*(?:top|tp)\)/.test(s)) return 1;
  if (/\(\*(?:top|tp)\)--/.test(s) || /--\(\*(?:top|tp)\)/.test(s)) return -1;
  return null;
}

function ptrStepFromLine(line: string, name: string): number | null {
  const s = line.replace(/\s+/g, "");
  const re = new RegExp(`\\*${name}\\s*=\\s*\\(\\*${name}\\s*\\+\\s*1\\)\\s*%`);
  if (re.test(s)) return 1;
  const re2 = new RegExp(`\\*${name}\\s*=\\s*\\*${name}\\s*\\+\\s*1`);
  if (re2.test(s)) return 1;
  return null;
}

function applyModStep(cur: number, step: number, cap: number, line: string): number {
  if (/%\s*\w+/.test(line) && cap > 0) return ((cur + step) % cap + cap) % cap;
  return cur + step;
}

function evalWriteValue(ev: TraceEvent, expr: string): number | string | null {
  const t = expr.trim();
  if (/^-?\d+$/.test(t)) return parseInt(t, 10);
  if (/^"(?:[^"\\]|\\.)*"$/.test(t) || /^'(?:[^'\\]|\\.)*'$/.test(t)) return t.slice(1, -1);
  const v = ev.variables[t];
  if (v && typeof v.value === "number") return v.value;
  if (v && typeof v.value === "string") return v.value;
  return null;
}

function applyWriteFromLine(
  ev: TraceEvent,
  arr: ArrayInfo | null,
  counters: { top: number | null; front: number | null; rear: number | null }
): void {
  if (!arr) return;
  const line = ev.line_text.trim();
  const m = line.match(/^(\w+)\s*\[([^\]]+)\]\s*=\s*([^;]+);?/);
  if (!m || m[1] !== arr.name) return;
  const idxExpr = m[2].replace(/\s+/g, "");
  let idx: number | null = null;
  if (/^-?\d+$/.test(idxExpr)) idx = parseInt(idxExpr, 10);
  else if (idxExpr === "*top" || idxExpr === "*tp" || idxExpr === "(*top)++" || idxExpr === "(*tp)++")
    idx = counters.top;
  else if (idxExpr === "*front" || idxExpr === "*f") idx = counters.front;
  else if (idxExpr === "*rear" || idxExpr === "*r" || idxExpr === "*back") idx = counters.rear;
  else idx = resolveIndex(ev, idxExpr);
  if (idx === null || idx < 0 || idx >= arr.elems.length) return;
  const val = evalWriteValue(ev, m[3]);
  if (val !== null) arr.elems[idx] = val;
}

export interface TraceState {
  tops: (number | null)[];
  fronts: (number | null)[];
  rears: (number | null)[];
  lows: (number | null)[];
  highs: (number | null)[];
  mids: (number | null)[];
  arrays: (ArrayInfo | null)[];
}

/**
 * One forward pass over real TraceEvents.
 * Resolves top/front/rear across pointer frames (int *top args) via line_text deltas,
 * snapshots arrays and applies real array writes observed while callees run.
 */
export function buildTraceState(events: TraceEvent[]): TraceState {
  const tops: (number | null)[] = [];
  const fronts: (number | null)[] = [];
  const rears: (number | null)[] = [];
  const lows: (number | null)[] = [];
  const highs: (number | null)[] = [];
  const mids: (number | null)[] = [];
  const arrays: (ArrayInfo | null)[] = [];

  let top: number | null = null;
  let front: number | null = null;
  let rear: number | null = null;
  let low: number | null = null;
  let high: number | null = null;
  let mid: number | null = null;
  let arr: ArrayInfo | null = null;

  for (const ev of events) {
    const curArr = firstArray(ev);
    if (curArr) arr = { ...curArr, elems: [...curArr.elems] };

    const nTop = numVar(ev, "top", "tp");
    const nFront = numVar(ev, "front", "f");
    const nRear = numVar(ev, "rear", "r", "back");
    const nLow = numVar(ev, "lo", "low", "left", "l");
    const nHigh = numVar(ev, "hi", "high", "right", "r0", "h");
    const nMid = numVar(ev, "mid", "m");

    if (nLow !== null) low = nLow;
    if (nHigh !== null) high = nHigh;
    if (nMid !== null) mid = nMid;

    const preTop = nTop !== null ? nTop : top;
    const preFront = nFront !== null ? nFront : front;
    const preRear = nRear !== null ? nRear : rear;
    if (arr) applyWriteFromLine(ev, arr, { top: preTop, front: preFront, rear: preRear });

    let nextTop: number | null = nTop !== null ? nTop : top;
    let nextFront: number | null = nFront !== null ? nFront : front;
    let nextRear: number | null = nRear !== null ? nRear : rear;
    const cap = arr?.length ?? 0;
    const line = ev.line_text;

    if (nTop === null && nextTop !== null && (hasPtr(ev, "top", "tp") || /\*(?:top|tp)\b/.test(line))) {
      const d = topDeltaFromLine(line);
      if (d !== null) nextTop = nextTop + d;
    }
    if (nFront === null && nextFront !== null && (hasPtr(ev, "front", "f") || /\*front\b/.test(line))) {
      const d = ptrStepFromLine(line, "front");
      if (d !== null) nextFront = applyModStep(nextFront, d, cap, line);
    }
    if (
      nRear === null &&
      nextRear !== null &&
      (hasPtr(ev, "rear", "r", "back") || /\*rear\b/.test(line))
    ) {
      const d = ptrStepFromLine(line, "rear");
      if (d !== null) nextRear = applyModStep(nextRear, d, cap, line);
    }

    top = nextTop;
    front = nextFront;
    rear = nextRear;
    tops.push(top);
    fronts.push(front);
    rears.push(rear);
    lows.push(low);
    highs.push(high);
    mids.push(mid);
    arrays.push(arr);
  }

  return { tops, fronts, rears, lows, highs, mids, arrays };
}

/**
 * Pure frontend interpreter: TraceEvent[] -> AlgorithmEvent[].
 * Derives higher-level ops from real trace state only — no fabricated animation.
 */
export function toAlgorithmEvents(events: TraceEvent[]): AlgorithmEvent[] {
  const out: AlgorithmEvent[] = [];
  const st = buildTraceState(events);

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const prev = i > 0 ? events[i - 1] : null;
    const arr = st.arrays[i];
    const prevArr = i > 0 ? st.arrays[i - 1] : null;
    const top = st.tops[i];
    const prevTop = i > 0 ? st.tops[i - 1] : null;
    const front = st.fronts[i];
    const rear = st.rears[i];
    const pf = i > 0 ? st.fronts[i - 1] : null;
    const pr = i > 0 ? st.rears[i - 1] : null;
    const low = st.lows[i];
    const high = st.highs[i];
    const mid = st.mids[i];
    const pLo = i > 0 ? st.lows[i - 1] : null;
    const pHi = i > 0 ? st.highs[i - 1] : null;

    // --- stack: top changed ---
    if (top !== null && prev && prevTop !== null && arr && prevArr) {
      if (top === prevTop + 1) {
        out.push({
          type: "push",
          step: ev.step,
          stackTop: top,
          indices: [prevTop],
          value: arr.elems[prevTop] ?? null,
        });
        continue;
      }
      if (top === prevTop - 1) {
        out.push({
          type: "pop",
          step: ev.step,
          stackTop: top,
          indices: [top],
          value: prevArr.elems[top] ?? null,
        });
        continue;
      }
      if (top > 0 && isCompareLine(ev.line_text, arr.name || "st") && ev.event === "compare") {
        const idxs = compareIndicesFromLine(ev.line_text, arr.name || "st", ev);
        if (idxs.length && idxs[0] === top - 1) {
          out.push({ type: "visit", step: ev.step, indices: idxs, stackTop: top, value: arr.elems[idxs[0]] ?? null });
          continue;
        }
      }
    }

    // --- queue: front/rear ---
    if (front !== null && rear !== null && prev && pf !== null && pr !== null && arr) {
      if (rear !== pr) {
        const cap = arr.length || 1;
        const wroteIdx = ((pr % cap) + cap) % cap;
        if (ev.event === "write" || ev.event === "array_write" || rear === ((pr + 1) % cap)) {
          out.push({
            type: "enqueue",
            step: ev.step,
            queueFront: front,
            queueRear: rear,
            indices: [wroteIdx],
            value: arr.elems[wroteIdx] ?? null,
          });
          continue;
        }
      }
      if (front !== pf) {
        const cap = arr.length || 1;
        const readIdx = ((pf % cap) + cap) % cap;
        if (front === ((pf + 1) % cap) || ev.event === "return" || ev.event === "step") {
          out.push({
            type: "dequeue",
            step: ev.step,
            queueFront: front,
            queueRear: rear,
            indices: [readIdx],
            value: prevArr?.elems[readIdx] ?? null,
          });
          continue;
        }
      }
    }

    // --- binary search: low/mid/high range ---
    if (low !== null && high !== null && mid !== null && arr) {
      if (ev.event === "compare" || isCompareLine(ev.line_text, arr.name || "a")) {
        const idxs = compareIndicesFromLine(ev.line_text, arr.name || "a", ev);
        const cmpIdx = idxs.length ? idxs : [mid];
        out.push({
          type: "compare",
          step: ev.step,
          indices: cmpIdx,
          value: arr.elems[cmpIdx[0]] ?? null,
          range: { low, mid, high },
        });
        continue;
      }
      if (prev && pLo !== null && pHi !== null && ((pLo !== low) || (pHi !== high))) {
        out.push({
          type: "range",
          step: ev.step,
          range: { low, mid, high },
          indices: [low, mid, high],
        });
        continue;
      }
    }

    // --- generic from backend event labels ---
    if (ev.event === "swap" && ev.swap) {
      out.push({ type: "swap", step: ev.step, indices: [ev.swap.i, ev.swap.j] });
      continue;
    }
    if (ev.event === "compare" && arr && isCompareLine(ev.line_text, arr.name)) {
      out.push({
        type: "compare",
        step: ev.step,
        indices: compareIndicesFromLine(ev.line_text, arr.name, ev),
      });
      continue;
    }
    if ((ev.event === "write" || ev.event === "array_write") && arr) {
      const idxs = compareIndicesFromLine(ev.line_text, arr.name, ev);
      out.push({ type: "write", step: ev.step, indices: idxs });
      continue;
    }
    if (ev.event === "pointer_move") {
      out.push({ type: "visit", step: ev.step });
      continue;
    }
  }

  return out;
}

export function summarizeAlgorithmEvents(events: AlgorithmEvent[]): AlgorithmStats {
  const s = emptyAlgorithmStats();
  for (const e of events) {
    switch (e.type) {
      case "compare":
        s.comparisons++;
        break;
      case "swap":
        s.swaps++;
        break;
      case "write":
        s.writes++;
        break;
      case "visit":
        s.visits++;
        break;
      case "push":
        s.pushes++;
        break;
      case "pop":
        s.pops++;
        break;
      case "enqueue":
        s.enqueues++;
        break;
      case "dequeue":
        s.dequeues++;
        break;
    }
  }
  return s;
}

export type AlgorithmKind = "stack" | "queue" | "binary_search" | "none";

/** Detect which specialized structure view applies for a run (from real vars). */
export function detectAlgorithmKind(events: TraceEvent[]): AlgorithmKind {
  const st = buildTraceState(events);
  const n = Math.max(1, events.length);
  let stackVotes = 0;
  let queueVotes = 0;
  let searchVotes = 0;
  const step = Math.max(1, Math.floor(events.length / 20));
  for (let i = 0; i < events.length; i += step) {
    const ev = events[i];
    if (st.tops[i] !== null && st.arrays[i]) stackVotes++;
    if (st.fronts[i] !== null && st.rears[i] !== null && st.arrays[i]) queueVotes++;
    if (
      (st.lows[i] !== null || numVar(ev, "lo", "low", "left", "l") !== null) &&
      (st.highs[i] !== null || numVar(ev, "hi", "high", "right") !== null) &&
      (st.mids[i] !== null || numVar(ev, "mid", "m") !== null)
    )
      searchVotes++;
  }
  const sampled = Math.max(1, Math.ceil(events.length / step));
  if (searchVotes / sampled >= 0.3) return "binary_search";
  if (queueVotes / sampled >= 0.3) return "queue";
  if (stackVotes / sampled >= 0.3) return "stack";
  return "none";
}
