import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = `modal-title-${Math.random().toString(36).substring(2, 9)}`;

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;

      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      setTimeout(() => {
        if(focusableElements && focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current?.focus();
        }
      }, 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }

        if (e.key === 'Tab' && modalRef.current && focusableElements) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else { // Tab
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        triggerRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up focus:outline-none"
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 id={titleId} className="text-lg font-bold text-gray-100">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-1.5 transition-colors"
            aria-label="Close dialog"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};


interface NewFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (fileName: string) => void;
  existingFiles: string[];
}

export const NewFileModal: React.FC<NewFileModalProps> = ({ isOpen, onClose, onCreate, existingFiles }) => {
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFileName('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fileName.trim();
    
    if (!trimmedName) {
      setError('File name cannot be empty.');
      return;
    }

    if (existingFiles.some(f => f.toLowerCase() === trimmedName.toLowerCase())) {
      setError(`A file named "${trimmedName}" already exists.`);
      return;
    }

    onCreate(trimmedName);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(e.target.value);
    if(error) setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New File">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col space-y-4">
          <label htmlFor="fileName" className="text-gray-300">File Name</label>
          <input
            id="fileName"
            type="text"
            value={fileName}
            onChange={handleInputChange}
            placeholder="e.g., component.js"
            className={`w-full bg-gray-900/50 border text-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${error ? 'border-red-500' : 'border-gray-600'}`}
            autoFocus
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold"
            >
              Create
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};


interface ConfirmNewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmNewProjectModal: React.FC<ConfirmNewProjectModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start New Project?">
        <div className="space-y-4">
            <p className="text-gray-300">
                Are you sure? This will clear your current project from the workspace and local storage. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors font-semibold"
            >
              Confirm & Reset
            </button>
          </div>
        </div>
    </Modal>
  );
};