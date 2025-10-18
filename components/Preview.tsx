import React from 'react';
import { FullscreenEnterIcon, FullscreenExitIcon } from './Icons';

interface PreviewProps {
  html: string;
  isFullscreen: boolean;
  setIsFullscreen: (isFullscreen: boolean) => void;
}

export const Preview: React.FC<PreviewProps> = ({ html, isFullscreen, setIsFullscreen }) => {
  return (
    <div className="bg-white rounded-lg shadow-inner flex flex-col h-full overflow-hidden border border-gray-700">
       <div className="flex justify-between items-center p-3 bg-gray-700/50 border-b border-gray-700">
        <h2 className="font-semibold text-gray-300">Live Preview</h2>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="text-gray-300 hover:text-white p-1 rounded-md"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <FullscreenExitIcon className="w-5 h-5" />
          ) : (
            <FullscreenEnterIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      <iframe
        srcDoc={html}
        title="Live Preview"
        sandbox="allow-scripts allow-modals allow-forms"
        className="w-full h-full border-0"
      />
    </div>
  );
};