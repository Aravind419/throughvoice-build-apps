import React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { SpinnerIcon } from './Icons';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export type EditorRef = monaco.editor.IStandaloneCodeEditor;

interface MonacoEditorProps {
  fileName: string;
  content: string;
  onChange: (value: string | undefined) => void;
  editorRef?: React.MutableRefObject<EditorRef | null>;
}

const getLanguage = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
};

export const MonacoEditor: React.FC<MonacoEditorProps> = ({ fileName, content, onChange, editorRef }) => {
  const handleEditorDidMount: OnMount = (editor) => {
    if (editorRef) {
      editorRef.current = editor;
    }
  };
  
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={getLanguage(fileName)}
        value={content}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          folding: true,
          acceptSuggestionOnEnter: 'on', // Enable autocomplete on Enter
        }}
        loading={<SpinnerIcon className="w-8 h-8 animate-spin text-gray-400" />}
      />
    </div>
  );
};