import React from 'react';
import { useToast } from './use-toast';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg ${
            toast.status === 'info'
              ? 'bg-blue-100 text-blue-800'
              : toast.status === 'success'
              ? 'bg-green-100 text-green-800'
              : toast.status === 'warning'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{toast.title}</h3>
              {toast.description && (
                <p className="text-sm mt-1">{toast.description}</p>
              )}
            </div>
            {toast.isClosable && (
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 