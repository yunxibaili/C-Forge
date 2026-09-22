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

const cfTheme = EditorView.theme(
  {
    "&": {
      color: "#c9d1d9",
      backgroundColor: "#0d1117",
      height: "100%",
      fontSize: "13.5px",
    },
    ".cm-content": {
      fontFamily: "Consolas, 'Cascadia Code', 'Courier New', monospace",
      padding: "10px 0",
      caretColor: "#4fd1c5",
    },
    ".cm-gutters": {
      backgroundColor: "#0d1117",
      color: "#4b5568",
      border: "none",
      borderRight: "1px solid #1c2230",
    },
    ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px 0 12px" },
    ".cm-activeLine": { backgroundColor: "rgba(56,139,253,0.07)" },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(56,139,253,0.07)",
      color: "#58a6ff",
    },
    ".cm-cf-line": {
      backgroundColor: "rgba(79,209,197,0.14)",
      boxShadow: "inset 3px 0 0 #4fd1c5",
    },
    "&.cm-focused": { outline: "none" },
    ".cm-selectionBackground, ::selection": { backgroundColor: "rgba(56,139,253,0.35)" },
    ".cm-cursor": { borderLeftColor: "#4fd1c5" },
    ".cm-scroller": { overflow: "auto" },
  },
  { dark: true }
);

const cfHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#ff7b72" },
  { tag: [tags.controlKeyword, tags.operatorKeyword], color: "#ff7b72" },
  { tag: tags.string, color: "#a5d6ff" },
  { tag: [tags.number, tags.bool, tags.null], color: "#79c0ff" },
  { tag: tags.comment, color: "#6e7681", fontStyle: "italic" },
  { tag: tags.function(tags.variableName), color: "#d2a8ff" },
  { tag: tags.typeName, color: "#ffa657" },
  { tag: tags.definition(tags.variableName), color: "#ffa657" },
  { tag: tags.operator, color: "#ff7b72" },
  { tag: tags.className, color: "#ffa657" },
]);

interface Props {
  code: string;
  onChange: (code: string) => void;
  activeLine: number;
}

export default function Editor({ code, onChange, activeLine }: Props) {
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
        cfTheme,
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString());
        }),
        EditorView.lineWrapping,
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

  return <div ref={hostRef} style={{ flex: 1, minHeight: 0 }} />;
}
