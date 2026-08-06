// Tiny event bus that lets code OUTSIDE React (like the axios interceptor
// in services/api.js) trigger a toast popup, by talking to whatever
// ToastProvider is currently mounted.

let listeners = [];

export const subscribeToast = (fn) => {
  listeners.push(fn);
  return () => { listeners = listeners.filter((l) => l !== fn); };
};

export const emitToast = (message, type = 'error') => {
  listeners.forEach((fn) => fn(message, type));
};
