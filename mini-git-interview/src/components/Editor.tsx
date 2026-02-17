"use client";

import { useRef, useCallback } from "react";
import MonacoEditor, { OnMount, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onEditorChange?: (changes: editor.IModelContentChange[]) => void;
}

export default function Editor({ value, onChange, onEditorChange }: EditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.focus();

    editor.onDidChangeModelContent((e) => {
      if (onEditorChange) {
        onEditorChange(e.changes);
      }
    });
  }, [onEditorChange]);

  const handleChange: OnChange = useCallback(
    (val) => {
      onChange(val ?? "");
    },
    [onChange]
  );

  return (
    <div className="h-full w-full border border-zinc-700 rounded-md overflow-hidden">
      <MonacoEditor
        height="100%"
        language="javascript"
        theme="vs-dark"
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 8 },
        }}
      />
    </div>
  );
}
