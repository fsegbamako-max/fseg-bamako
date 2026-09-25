import { create } from 'zustand';

let counter = 0;

export const useToastStore = create((set) => ({
  toasts: [],
  add: (message, type = 'success', duration = 4000) => {
    const id = ++counter;
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, duration);
  },
  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
}));

export const toast = {
  success: (msg) => useToastStore.getState().add(msg, 'success'),
  error:   (msg) => useToastStore.getState().add(msg, 'error'),
  info:    (msg) => useToastStore.getState().add(msg, 'info'),
};
