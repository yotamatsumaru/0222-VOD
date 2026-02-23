'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="fas fa-check-circle text-green-400 text-xl"></i>;
      case 'error':
        return <i className="fas fa-exclamation-circle text-red-400 text-xl"></i>;
      case 'warning':
        return <i className="fas fa-exclamation-triangle text-yellow-400 text-xl"></i>;
      case 'info':
        return <i className="fas fa-info-circle text-blue-400 text-xl"></i>;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/50 text-green-100';
      case 'error':
        return 'bg-red-500/20 border-red-500/50 text-red-100';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-100';
      case 'info':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-100';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-lg border backdrop-blur-md shadow-2xl min-w-[300px] max-w-md ${getColors()}`}>
        {getIcon()}
        <p className="flex-1 font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}
