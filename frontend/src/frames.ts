import type { StackFrameView, TraceEvent, VarMeta } from "./types";

export interface FrameTimeline {
  frames: StackFrameView[];
  maxDepth: number;
  lastTransition: "call" | "return" | "none";
  transitionDepth: number;
  popped: StackFrameView[] | null;
}

function cloneFrame(f: StackFrameView): StackFrameView {
  return { ...f, vars: { ...f.vars }, pointers: [...f.pointers] };
}

function makeFrame(name: string, depth: number, enteredAt: number, callLine: number | null, callLineText: string | null): StackFrameView {
  return {
    id: `${name}#${depth}`,
    name,
    depth,
    callLine,
    callLineText,
    returnTo: null,
    returnLine: null,
    isInnermost: false,
    vars: {},
    pointers: [],
    line: null,
    enteredAt,
    exitedAt: null,
  };
}

export function buildFrames(events: TraceEvent[], index: number): FrameTimeline {
  if (!events.length || index < 0) {
    return { frames: [], maxDepth: 0, lastTransition: "none", transitionDepth: 0, popped: null };
  }

  const end = Math.min(index, events.length - 1);
  const active: StackFrameView[] = [];
  let maxDepth = 0;

  for (let i = 0; i <= end; i++) {
    const ev = events[i];
    const prev = i > 0 ? events[i - 1] : null;
    const depth = ev.stack.length;
    if (depth > maxDepth) maxDepth = depth;

    const prevDepth = prev ? prev.stack.length : depth;
    const callLine = prev ? prev.line : null;
    const callLineText = prev ? prev.line_text : null;

    if (depth > prevDepth) {
      while (active.length < depth) {
        const d = active.length;
        const name = ev.stack[depth - 1 - d] ?? "?";
        active.push(makeFrame(name, d, i, d > 0 ? callLine : null, d > 0 ? callLineText : null));
      }
    } else if (depth < prevDepth) {
      const popped = active.splice(depth);
      for (const f of popped) {
        f.isInnermost = false;
        f.exitedAt = i;
      }
      const caller = active[active.length - 1];
      if (caller) {
        caller.returnTo = ev.function;
        caller.returnLine = ev.line;
      }
    }

    while (active.length < depth) {
      const d = active.length;
      const name = ev.stack[depth - 1 - d] ?? "?";
      active.push(makeFrame(name, d, i, null, null));
    }

    for (let d = 0; d < active.length; d++) {
      const f = active[d];
      const name = ev.stack[depth - 1 - d] ?? f.name;
      if (f.name !== name) {
        f.name = name;
        f.id = `${name}#${d}`;
      }
      f.isInnermost = d === active.length - 1;
      if (f.isInnermost) {
        f.vars = { ...ev.variables };
        f.pointers = [...ev.pointers];
        f.line = ev.line;
      }
    }
  }

  const prev = end > 0 ? events[end - 1] : null;
  const cur = events[end];
  let transition: FrameTimeline["lastTransition"] = "none";
  let popOnStep: StackFrameView[] | null = null;

  if (prev && cur.stack.length > prev.stack.length) {
    transition = "call";
  } else if (prev && cur.stack.length < prev.stack.length) {
    transition = "return";
    popOnStep = [makeFrame(prev.stack[0] ?? "?", cur.stack.length, Math.max(0, end - 1), null, null)];
    popOnStep[0].exitedAt = end;
  }

  return {
    frames: active.map(cloneFrame),
    maxDepth,
    lastTransition: transition,
    transitionDepth: cur.stack.length,
    popped: popOnStep,
  };
}

export function splitVars(vars: Record<string, VarMeta>): {
  params: [string, VarMeta][];
  locals: [string, VarMeta][];
} {
  const params: [string, VarMeta][] = [];
  const locals: [string, VarMeta][] = [];
  for (const [k, v] of Object.entries(vars)) {
    if (v.arg) params.push([k, v]);
    else locals.push([k, v]);
  }
  return { params, locals };
}
