import React from 'react';
import { MicIcon, SendIcon, SpinnerIcon } from './Icons';

interface InputBarProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({
  prompt,
  setPrompt,
  onSubmit,
  isLoading,
  isListening,
  startListening,
  stopListening
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="flex items-center w-full bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-2">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? "Listening..." : "Describe what you want to build..."}
        className="flex-grow bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none px-4"
        disabled={isListening}
        aria-label="Describe your coding request"
      />
      <button
        onClick={isListening ? stopListening : startListening}
        className={`p-2 rounded-full transition-colors duration-200 ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        } disabled:opacity-50 disabled:cursor-not-allowed mr-2`}
        aria-label={isListening ? "Stop listening" : "Start listening"}
      >
        <MicIcon className="w-5 h-5" />
      </button>
      <button
        onClick={onSubmit}
        disabled={!prompt}
        className="flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
        aria-label="Generate code"
      >
        {isLoading ? (
          <SpinnerIcon className="w-5 h-5 animate-spin" />
        ) : (
          <SendIcon className="w-5 h-5" />
        )}
        <span className="ml-2">{isLoading ? 'Generating...' : 'Generate'}</span>
      </button>
    </div>
  );
};