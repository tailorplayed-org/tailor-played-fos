import { create } from 'zustand';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  action?: { label: string; onClick: () => void };
}

interface UIStore {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// Convenience functions for direct use without hooks
export const toast = {
  success: (message: string) =>
    useUIStore.getState().addToast({ type: 'success', message }),
  error: (message: string, action?: ToastData['action']) =>
    useUIStore.getState().addToast({ type: 'error', message, action }),
  warning: (message: string) =>
    useUIStore.getState().addToast({ type: 'warning', message }),
  info: (message: string) =>
    useUIStore.getState().addToast({ type: 'info', message }),
};
