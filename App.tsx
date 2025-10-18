import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { InputBar } from './components/InputBar';
import { CodeWorkspace, FileData } from './components/CodeWorkspace';
import { Preview } from './components/Preview';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { formatCode } from './utils/formatter';

const SYSTEM_INSTRUCTION_STREAM = `You are an expert web developer AI. Your task is to generate the complete code for a web component or a full webpage based on the user's description.

You MUST respond with a stream of text. Use the following special format to structure your response:

1.  Start each file with a file marker: \`>>>FILE: [filename.ext]\` on its own line.
2.  Follow the marker with the complete code for that file.
3.  Do NOT add any other markers, comments, or explanations.
4.  Stream the response, outputting the file marker and then the file content chunk by chunk.

Example of the streamed text output:
>>>FILE: index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>My Page</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello!</h1>
    <script src="script.js"></script>
</body>
</html>
>>>FILE: style.css
body {
    font-family: sans-serif;
}
>>>FILE: script.js
console.log("Hello from script!");

- Create all necessary files (HTML, CSS, JS).
- Ensure generated code is complete and runnable.
- For React projects, create a single self-contained HTML file using CDNs for React, ReactDOM, and Babel.
`;

const DEFAULT_FILES: FileData[] = [
  {
    fileName: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Awesome Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello, World!</h1>
    <p>Describe what you want to build in the input below.</p>
    <script src="script.js"></script>
</body>
</html>`,
  },
  {
    fileName: 'style.css',
    content: `body {
  font-family: sans-serif;
  background-color: #f0f0f0;
  color: #333;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}`,
  },
  {
    fileName: 'script.js',
    content: `console.log("Welcome to your new project!");`,
  },
];

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<FileData[]>(() => {
    try {
      const saved = localStorage.getItem('code-project');
      return saved ? JSON.parse(saved) : DEFAULT_FILES;
    } catch (error) {
      console.error("Failed to parse project from local storage:", error);
      localStorage.removeItem('code-project'); // Clear corrupted data
      return DEFAULT_FILES;
    }
  });
  const [activeFileName, setActiveFileName] = useState(files[0]?.fileName || 'index.html');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [snippets, setSnippets] = useState<string[]>([]);
  const [isSnippetsLoading, setIsSnippetsLoading] = useState(false);
  const [snippetsError, setSnippetsError] = useState<string | null>(null);
  
  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  useEffect(() => {
    localStorage.setItem('code-project', JSON.stringify(files));
    if (!files.some(f => f.fileName === activeFileName)) {
      setActiveFileName(files[0]?.fileName || '');
    }
  }, [files, activeFileName]);

  useEffect(() => {
    if (transcript) {
      setPrompt(transcript);
    }
  }, [transcript]);
  
  const resetProject = () => {
    setFiles(DEFAULT_FILES);
    setActiveFileName(DEFAULT_FILES[0].fileName);
  };

  const handleFetchSnippets = async (fileContent: string, fileName: string) => {
    setIsSnippetsLoading(true);
    setSnippetsError(null);
    setSnippets([]);
    try {
      const snippetPrompt = `Based on the following code from the file "${fileName}", generate a list of 5 relevant and useful code snippets. The snippets should be practical additions or improvements.

File Content:
\`\`\`
${fileContent}
\`\`\`

Respond with a JSON object containing a "snippets" key, which is an array of code strings.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: snippetPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              snippets: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['snippets'],
          },
        },
      });

      const parsed = JSON.parse(response.text.trim());
      if (parsed.snippets && Array.isArray(parsed.snippets)) {
        setSnippets(parsed.snippets);
      } else {
        throw new Error('Invalid snippet format from API.');
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setSnippetsError(`Failed to fetch snippets: ${errorMessage}`);
    } finally {
      setIsSnippetsLoading(false);
    }
  };

 const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setFiles([]); // Start with a clean slate for the new generation
    let currentFileName: string | null = null;
    let buffer = '';

    try {
      const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_STREAM,
        },
      });

      for await (const chunk of stream) {
        buffer += chunk.text;
        
        let lineEndIndex;
        // Process all complete lines in the buffer
        while ((lineEndIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.substring(0, lineEndIndex);
            buffer = buffer.substring(lineEndIndex + 1); // Keep the remainder for the next iteration

            if (line.startsWith('>>>FILE:')) {
                const newFileName = line.substring('>>>FILE:'.length).trim();
                if (newFileName) {
                    currentFileName = newFileName;
                    setFiles(prevFiles => {
                        // Avoid adding duplicate files if the stream re-sends a header
                        if (prevFiles.some(f => f.fileName === newFileName)) {
                            return prevFiles;
                        }
                        return [...prevFiles, { fileName: newFileName, content: '' }];
                    });
                    setActiveFileName(newFileName);
                }
            } else if (currentFileName) {
                // Add the line of code to the current file
                setFiles(prevFiles =>
                    prevFiles.map(f =>
                        f.fileName === currentFileName
                            ? { ...f, content: f.content + line + '\n' }
                            : f
                    )
                );
            }
        }
      }

      // After the stream is done, process any remaining text in the buffer
      if (currentFileName && buffer.length > 0) {
           setFiles(prevFiles =>
              prevFiles.map(f =>
                  f.fileName === currentFileName
                      ? { ...f, content: f.content + buffer }
                      : f
              )
          );
      }

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate code: ${errorMessage}. Please check your API key and try again.`);
    } finally {
      setIsLoading(false);
      // Final formatting pass after the stream is complete
      setFiles(async (currentFiles) => {
        const formattedFiles = await Promise.all(
          currentFiles.map(async (file) => ({
            fileName: file.fileName,
            content: await formatCode(file.fileName, file.content),
          }))
        );
        return formattedFiles;
      });
    }
  };

  const htmlContent = useMemo(() => {
    const htmlFile = files.find(f => f.fileName.endsWith('.html'));
    if (!htmlFile) return '<html><body><p>No index.html file found.</p></body></html>';
    
    let processedHtml = htmlFile.content;

    const cssFiles = files.filter(f => f.fileName.endsWith('.css'));
    if (cssFiles.length > 0) {
        const cssContent = cssFiles.map(f => f.content).join('\n');
        processedHtml = processedHtml.replace(
            /<\/head>/,
            `<style>${cssContent}</style></head>`
        );
    }

    const jsFiles = files.filter(f => f.fileName.endsWith('.js'));
    if (jsFiles.length > 0) {
        const jsContent = jsFiles.map(f => f.content).join(';\n');
        processedHtml = processedHtml.replace(
            /<\/body>/,
            `<script>${jsContent}</script></body>`
        );
    }

    return processedHtml;
  }, [files]);
  
  const editorPaneClasses = isFullscreen ? 'hidden' : 'lg:w-1/2';
  const previewPaneClasses = isFullscreen ? 'w-full h-full' : 'lg:w-1/2';

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <header className="flex-shrink-0 flex items-center justify-center p-4 border-b border-gray-700 shadow-md bg-gray-800">
        <h1 className="text-2xl font-bold tracking-wider">
          AI Frontend <span className="text-indigo-400">Builder</span>
        </h1>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row p-4 gap-4 overflow-hidden">
        <div className={`flex flex-col ${editorPaneClasses} transition-all duration-300`}>
          <CodeWorkspace 
            files={files} 
            setFiles={setFiles}
            activeFileName={activeFileName}
            setActiveFileName={setActiveFileName}
            resetProject={resetProject}
            snippets={snippets}
            isSnippetsLoading={isSnippetsLoading}
            snippetsError={snippetsError}
            onFetchSnippets={handleFetchSnippets}
          />
        </div>
        <div className={`flex flex-col ${previewPaneClasses} transition-all duration-300`}>
          <Preview 
            html={htmlContent} 
            isFullscreen={isFullscreen} 
            setIsFullscreen={setIsFullscreen}
          />
        </div>
      </main>

      <footer className="flex-shrink-0 p-4">
        {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4 text-sm">
                <strong>Error:</strong> {error}
            </div>
        )}
        <InputBar
          prompt={prompt}
          setPrompt={setPrompt}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isListening={isListening}
          startListening={startListening}
          stopListening={stopListening}
        />
      </footer>
    </div>
  );
};

export default App;