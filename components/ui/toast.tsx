"use client";

import { CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "info" | "warning" | "error";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

type ShowToast = (toast: Omit<Toast, "id">) => void;

const ToastContext = createContext<ShowToast | null>(null);

const ICONS: Record<ToastTone, ReactNode> = {
  success: <CircleCheck className="text-success" />,
  info: <Info className="text-accent-text" />,
  warning: <TriangleAlert className="text-warning" />,
  error: <TriangleAlert className="text-danger" />,
};

const DURATION_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback<ShowToast>(
    (toast) => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-3), { ...toast, id }]);
      // Errors and warnings stay a little longer so they can be read.
      const duration = toast.tone === "error" || toast.tone === "warning" ? DURATION_MS * 2 : DURATION_MS;
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm shadow-[var(--shadow-raised)]",
              "[&>svg]:mt-0.5 [&>svg]:size-5 [&>svg]:shrink-0",
            )}
          >
            {ICONS[toast.tone]}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-fg">{toast.title}</p>
              {toast.description ? <p className="mt-0.5 text-muted">{toast.description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="-m-1 rounded-md p-1 text-muted transition-colors hover:bg-surface-muted hover:text-fg"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
