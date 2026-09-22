import { useEffect, useRef } from "react";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
} from "@codemirror/commands";
import {
  HighlightStyle,
  StreamLanguage,
  bracketMatching,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { c } from "@codemirror/legacy-modes/mode/clike";
import { tags } from "@lezer/highlight";

const setLine = StateEffect.define<number>();
const setErrorLine = StateEffect.define<number | null>();

const lineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    for (const e of tr.effects) {
      if (e.is(setLine)) {
        const n = Math.max(1, Math.min(tr.state.doc.lines, e.value));
        const line = tr.state.doc.line(n);
        return Decoration.set([Decoration.line({ class: "cm-cf-line" }).range(line.from)]);
      }
    }
    return deco.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

const errField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    for (const e of tr.effects) {
      if (e.is(setErrorLine)) {
        if (e.value == null || e.value < 1) return Decoration.none;
        const n = Math.min(tr.state.doc.lines, e.value);
        const line = tr.state.doc.line(n);
        return Decoration.set([Decoration.line({ class: "cm-cf-err" }).range(line.from)]);
      }
    }
    return deco.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

const cfTheme = EditorView.theme(
  {
    "&": {
      color: "#1a1a1e",
      backgroundColor: "transparent",
      height: "100%",
      fontSize: "13.5px",
    },
    ".cm-content": {
      fontFamily: "Cascadia Code, Fira Code, Consolas, monospace",
      padding: "10px 0",
      caretColor: "#0e7490",
    },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "#a0a0aa",
      border: "none",
      borderRight: "1px solid rgba(0,0,0,0.08)",
    },
    ".cm-lineNumbers .cm-gutterElement": { padding: "0 12px 0 16px" },
    ".cm-activeLine": { backgroundColor: "rgba(0,0,0,0.03)" },
    ".cm-cf-line": {
      backgroundColor: "rgba(8,145,178,0.08)",
      boxShadow: "inset 2px 0 0 #0891b2",
    },
    "&.cm-focused": { outline: "none" },
    ".cm-selectionBackground, ::selection": { backgroundColor: "rgba(8,145,178,0.18)" },
    ".cm-cursor": { borderLeftColor: "#0e7490" },
    ".cm-scroller": { overflow: "auto" },
  },
  { dark: false }
);

const cfHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#1d4ed8" },
  { tag: [tags.controlKeyword, tags.operatorKeyword], color: "#1d4ed8" },
  { tag: tags.string, color: "#15803d" },
  { tag: [tags.number, tags.bool, tags.null], color: "#b45309" },
  { tag: tags.comment, color: "#8b8b94", fontStyle: "italic" },
  { tag: tags.function(tags.variableName), color: "#7c3aed" },
  { tag: tags.typeName, color: "#0e7490" },
  { tag: tags.definition(tags.variableName), color: "#3f3f46" },
  { tag: tags.operator, color: "#5c5c66" },
  { tag: tags.className, color: "#0e7490" },
  { tag: tags.propertyName, color: "#3f3f46" },
  { tag: tags.variableName, color: "#1a1a1e" },
]);

interface Props {
  code: string;
  onChange: (code: string) => void;
  activeLine: number;
  errorLine?: number | null;
}

export default function Editor({ code, onChange, activeLine, errorLine }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current) return;
    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        history(),
        indentOnInput(),
        bracketMatching(),
        syntaxHighlighting(cfHighlight),
        StreamLanguage.define(c),
        lineField,
        errField,
        cfTheme,
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString());
        }),
      ],
    });
    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const doc = view.state.doc.toString();
    if (doc !== code) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: code },
      });
    }
  }, [code]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || activeLine < 1) return;
    view.dispatch({ effects: setLine.of(activeLine) });
    const line = view.state.doc.line(Math.min(activeLine, view.state.doc.lines));
    view.dispatch({
      effects: EditorView.scrollIntoView(line.from, { y: "center" }),
    });
  }, [activeLine]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setErrorLine.of(errorLine ?? null) });
  }, [errorLine]);

  return <div ref={hostRef} style={{ flex: 1, minHeight: 0, height: "100%" }} />;
}
