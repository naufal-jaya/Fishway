"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  duration?: number;
};

type ToastContextType = {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, message, actionLabel, actionHref, duration = 4000 }: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message, actionLabel, actionHref, duration }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

// ---- Toast Container UI ----
import Link from "next/link";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, ArrowRight } from "lucide-react";

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <AlertCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const STYLES: Record<ToastType, string> = {
  success: "bg-white border-l-4 border-l-emerald-500 text-gray-800",
  error: "bg-white border-l-4 border-l-red-500 text-gray-800",
  warning: "bg-white border-l-4 border-l-amber-400 text-gray-800",
  info: "bg-white border-l-4 border-l-[#407BB5] text-gray-800",
};

const ICON_STYLES: Record<ToastType, string> = {
  success: "text-emerald-500",
  error: "text-red-500",
  warning: "text-amber-400",
  info: "text-[#407BB5]",
};

const PROGRESS_STYLES: Record<ToastType, string> = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  warning: "bg-amber-400",
  info: "bg-[#407BB5]",
};

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)]"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl shadow-lg px-4 py-3.5 overflow-hidden
        ${STYLES[toast.type]}
        animate-[slideIn_0.25s_ease-out]`}
      style={{ animation: "slideIn 0.25s ease-out" }}
    >
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-[3px] ${PROGRESS_STYLES[toast.type]} opacity-30`}
          style={{
            width: "100%",
            animation: `shrink ${toast.duration}ms linear forwards`,
          }}
        />
      )}

      {/* Icon */}
      <span className={`mt-0.5 shrink-0 ${ICON_STYLES[toast.type]}`}>
        {ICONS[toast.type]}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{toast.message}</p>
        {toast.actionLabel && toast.actionHref && (
          <Link
            href={toast.actionHref}
            onClick={() => onRemove(toast.id)}
            className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold hover:underline ${ICON_STYLES[toast.type]}`}
          >
            {toast.actionLabel}
            <ArrowRight size={12} />
          </Link>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
        aria-label="Tutup notifikasi"
      >
        <X size={15} />
      </button>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}