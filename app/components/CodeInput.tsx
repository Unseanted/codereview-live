"use client";

import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { css } from "@codemirror/lang-css";
import { EditorView } from "@codemirror/view";

const languageExtensions: Record<string, ReturnType<typeof javascript>> = {
  JavaScript: javascript({ jsx: true }),
  TypeScript: javascript({ jsx: true, typescript: true }),
  Python: python(),
  "C++": cpp(),
  C: cpp(),
  Java: java(),
  CSS: css(),
};

function getExtension(language: string) {
  return languageExtensions[language] || javascript({ typescript: true });
}

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

export default function CodeInput({ value, onChange, language = "TypeScript" }: CodeInputProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-700 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
      <CodeMirror
        id="code-editor"
        value={value}
        height="220px"
        theme={oneDark}
        extensions={[
          getExtension(language),
          EditorView.lineWrapping,
        ]}
        onChange={onChange}
        placeholder="// Paste your code here..."
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          autocompletion: false,
        }}
        style={{ fontSize: "13px" }}
      />
    </div>
  );
}
