"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  show: (kind: ToastKind, message: string) => void;
};

const ToastCtx = createContext<ToastApi | null>(null);

let externalShow: ToastApi["show"] | null = null;

export function toast(kind: ToastKind, message: string) {
  if (externalShow) externalShow(kind, message);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback<ToastApi["show"]>((kind, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    externalShow = show;
    return () => {
      externalShow = null;
    };
  }, [show]);

  return (
    <ToastCtx.Provider value={{ show }}>
      <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto min-w-[260px] max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur",
              t.kind === "success" &&
                "border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/95 dark:text-emerald-100",
              t.kind === "error" &&
                "border-red-200 bg-red-50/95 text-red-900 dark:border-red-900 dark:bg-red-950/95 dark:text-red-100",
              t.kind === "info" &&
                "border-slate-200 bg-white/95 text-slate-900 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  return ctx;
}
