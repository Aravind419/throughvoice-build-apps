import React, { useState, useRef } from 'react';
import { MonacoEditor, EditorRef } from './MonacoEditor';
import { FileIcon, PlusIcon, NewProjectIcon, CloseIcon, CodeBracketIcon, SpinnerIcon, HtmlIcon, CssIcon, JsIcon } from './Icons';
import { NewFileModal, ConfirmNewProjectModal } from './Modals';

export interface FileData {
  fileName: string;
  content: string;
}

interface CodeWorkspaceProps {
  files: FileData[];
  setFiles: React.Dispatch<React.SetStateAction<FileData[]>>;
  activeFileName: string;
  setActiveFileName: (fileName: string) => void;
  resetProject: () => void;
  snippets: string[];
  isSnippetsLoading: boolean;
  snippetsError: string | null;
  onFetchSnippets: (fileContent: string, fileName: string) => void;
}

const GetFileIcon: React.FC<{ fileName: string, className?: string }> = ({ fileName, className }) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const defaultClassName = "w-4 h-4";
  const combinedClassName = `${defaultClassName} ${className || ''}`;

  switch (extension) {
    case 'html':
      return <HtmlIcon className={`${combinedClassName} text-orange-400`} />;
    case 'css':
      return <CssIcon className={`${combinedClassName} text-blue-400`} />;
    case 'js':
    case 'jsx':
      return <JsIcon className={`${combinedClassName} text-yellow-400`} />;
    case 'ts':
    case 'tsx':
      return <JsIcon className={`${combinedClassName} text-cyan-400`} />;
    default:
      return <FileIcon className={`${combinedClassName} text-gray-500`} />;
  }
};

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({
  files,
  setFiles,
  activeFileName,
  setActiveFileName,
  resetProject,
  snippets,
  isSnippetsLoading,
  snippetsError,
  onFetchSnippets,
}) => {
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'snippets'>('files');
  const editorRef = useRef<EditorRef | null>(null);
  
  const activeFile = files.find(f => f.fileName === activeFileName);

  const handleContentChange = (newContent: string | undefined) => {
    if (newContent === undefined) return;
    setFiles(currentFiles =>
      currentFiles.map(file =>
        file.fileName === activeFileName ? { ...file, content: newContent } : file
      )
    );
  };

  const handleCreateFile = (fileName: string) => {
    const newFile: FileData = { fileName, content: '' };
    setFiles(currentFiles => [...currentFiles, newFile]);
    setActiveFileName(fileName);
    setIsNewFileModalOpen(false);
  };

  const handleDeleteFile = (e: React.MouseEvent, fileNameToDelete: string) => {
    e.stopPropagation();
    
    setFiles(currentFiles => {
      const newFiles = currentFiles.filter(f => f.fileName !== fileNameToDelete);
      if (activeFileName === fileNameToDelete) {
        setActiveFileName(newFiles[0]?.fileName || ''); 
      }
      return newFiles;
    });
  };

  const handleConfirmReset = () => {
    resetProject();
    setIsConfirmModalOpen(false);
  };
  
  const handleSnippetInsert = (snippet: string) => {
    editorRef.current?.insertText(snippet);
  };

  return (
    <div className="flex h-full bg-gray-800 rounded-lg shadow-inner border border-gray-700 overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 max-w-xs flex flex-col bg-gray-900/40 border-r border-gray-700">
        <div className="flex-shrink-0 flex justify-between items-center p-2 border-b border-gray-700">
            <div role="tablist" aria-label="Sidebar View" className="flex items-center space-x-1">
                <button
                  id="files-tab"
                  role="tab"
                  aria-selected={activeTab === 'files'}
                  aria-controls="files-panel"
                  onClick={() => setActiveTab('files')}
                  className={`px-3 py-1.5 text-sm rounded-md flex items-center space-x-2 ${activeTab === 'files' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    <FileIcon className="w-4 h-4" />
                    <span>Files</span>
                </button>
                <button
                  id="snippets-tab"
                  role="tab"
                  aria-selected={activeTab === 'snippets'}
                  aria-controls="snippets-panel"
                  onClick={() => setActiveTab('snippets')}
                  className={`px-3 py-1.5 text-sm rounded-md flex items-center space-x-2 ${activeTab === 'snippets' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    <CodeBracketIcon className="w-4 h-4" />
                    <span>Snippets</span>
                </button>
            </div>
            <div className="flex items-center space-x-1">
                <button
                    onClick={() => setIsNewFileModalOpen(true)}
                    className="text-gray-300 hover:text-white hover:bg-gray-700 p-1.5 rounded-md transition-colors"
                    aria-label="New file"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="text-gray-300 hover:text-white hover:bg-gray-700 p-1.5 rounded-md transition-colors"
                    aria-label="New project"
                >
                    <NewProjectIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
        <div className="flex-grow overflow-y-auto">
            {activeTab === 'files' && (
                <div id="files-panel" role="tabpanel" aria-labelledby="files-tab">
                    <ul aria-label="File list">
                        {files.map(file => (
                            <li
                                key={file.fileName}
                                className={`flex justify-between items-center text-left text-sm border-b border-gray-800 transition-colors ${
                                    activeFileName === file.fileName ? 'bg-indigo-600/30' : 'hover:bg-gray-700/50'
                                }`}
                            >
                                <button
                                    onClick={() => setActiveFileName(file.fileName)}
                                    className={`flex items-center flex-grow text-left px-3 py-2 ${
                                        activeFileName === file.fileName ? 'text-white' : 'text-gray-400'
                                    }`}
                                    aria-current={activeFileName === file.fileName ? 'page' : undefined}
                                >
                                    <GetFileIcon fileName={file.fileName} className="mr-3 flex-shrink-0" />
                                    <span className="truncate">{file.fileName}</span>
                                </button>
                                {files.length > 1 && (
                                   <button 
                                    onClick={(e) => handleDeleteFile(e, file.fileName)}
                                    className="p-1 rounded-full hover:bg-gray-600 flex-shrink-0 ml-2 text-gray-400 hover:text-white mr-2"
                                    aria-label={`Delete ${file.fileName}`}
                                   >
                                     <CloseIcon className="w-3.5 h-3.5" />
                                   </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {activeTab === 'snippets' && (
                <div id="snippets-panel" role="tabpanel" aria-labelledby="snippets-tab" className="p-3 space-y-3">
                    <button 
                        onClick={() => activeFile && onFetchSnippets(activeFile.content, activeFile.fileName)}
                        disabled={isSnippetsLoading || !activeFile}
                        className="w-full bg-indigo-600 text-white px-3 py-2 rounded-md font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                       {isSnippetsLoading ? 'Generating...' : 'Get Suggestions'}
                    </button>
                    {isSnippetsLoading && <div className="flex justify-center p-4"><SpinnerIcon className="w-6 h-6 animate-spin"/></div>}
                    {snippetsError && <p className="text-red-400 text-sm">{snippetsError}</p>}
                    <div className="space-y-2">
                        {snippets.map((snippet, index) => (
                            <button key={index} onClick={() => handleSnippetInsert(snippet)} className="w-full text-left bg-gray-700/50 hover:bg-gray-700 p-2 rounded-md transition-colors">
                                <pre className="text-xs text-gray-300 whitespace-pre-wrap truncate"><code>{snippet.split('\n')[0]}...</code></pre>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-grow flex flex-col">
          <div className="flex-shrink-0 flex items-center border-b border-gray-700 bg-gray-800 overflow-x-auto" aria-label="Open file tabs">
            {files.map(file => (
              <button
                key={file.fileName}
                onClick={() => setActiveFileName(file.fileName)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm border-r border-gray-700 transition-colors ${
                  activeFileName === file.fileName
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                }`}
                aria-pressed={activeFileName === file.fileName}
              >
                <GetFileIcon fileName={file.fileName} />
                <span>{file.fileName}</span>
              </button>
            ))}
          </div>
          
          <div className="flex-grow relative">
            {activeFile ? (
              <MonacoEditor
                key={activeFile.fileName}
                editorRef={editorRef}
                fileName={activeFile.fileName}
                content={activeFile.content}
                onChange={handleContentChange}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No file selected.</p>
              </div>
            )}
          </div>
      </div>


      <NewFileModal 
        isOpen={isNewFileModalOpen}
        onClose={() => setIsNewFileModalOpen(false)}
        onCreate={handleCreateFile}
        existingFiles={files.map(f => f.fileName)}
      />

      <ConfirmNewProjectModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
};