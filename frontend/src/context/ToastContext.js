import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { subscribeToast } from '../utils/toastBus';

const ToastContext = createContext();

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const showToast = useCallback((message, type = 'error', duration = 4000) => {
    if (!message) return;
    const id = ++idCounter;
    setToasts((t) => [...t, { id, message, type }]);
    timers.current[id] = setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  // Let non-React code (axios interceptor) fire toasts too
  useEffect(() => subscribeToast((msg, type) => showToast(msg, type)), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* ── Popup stack — top right, newest at top ── */}
      <div
        className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5"
        style={{ maxWidth: 'min(360px, calc(100vw - 2.5rem))' }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className="flex items-start gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold shadow-xl animate-fade-up cursor-pointer"
            style={{
              background: t.type === 'success' ? 'var(--badge-resv-bg)' : 'var(--badge-rejt-bg)',
              color: t.type === 'success' ? 'var(--badge-resv-text)' : 'var(--badge-rejt-text)',
              border: `1px solid ${t.type === 'success' ? 'rgba(6,95,70,0.2)' : 'rgba(153,27,27,0.2)'}`,
              minWidth: '260px',
            }}
          >
            {t.type === 'success'
              ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
            <span className="flex-1 leading-snug">{t.message}</span>
            <X size={14} className="flex-shrink-0 mt-0.5 opacity-50" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
