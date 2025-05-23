import { useState, useCallback } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  status?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  isClosable?: boolean;
}

interface Toast extends ToastOptions {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...options,
      id,
      duration: options.duration || 3000,
      isClosable: options.isClosable ?? true,
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, removeToast };
}

export const toast = {
  info: (options: Omit<ToastOptions, 'status'>) => ({ ...options, status: 'info' }),
  success: (options: Omit<ToastOptions, 'status'>) => ({ ...options, status: 'success' }),
  warning: (options: Omit<ToastOptions, 'status'>) => ({ ...options, status: 'warning' }),
  error: (options: Omit<ToastOptions, 'status'>) => ({ ...options, status: 'error' }),
}; 