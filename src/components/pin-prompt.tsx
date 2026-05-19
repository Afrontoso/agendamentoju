"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  pending?: boolean;
  showScopeChoice?: boolean;
  onCancel: () => void;
  onConfirm: (pin: string, scope: "single" | "series") => void;
};

export function PinPrompt({
  title,
  description,
  pending,
  showScopeChoice,
  onCancel,
  onConfirm,
}: Props) {
  const [pin, setPin] = useState("");
  const [scope, setScope] = useState<"single" | "series">("single");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN deve ter 4 dígitos");
      return;
    }
    setError(null);
    onConfirm(pin, scope);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {description}
          </p>
        )}
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          {showScopeChoice && (
            <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700">
              <span className="font-medium">Aplicar a:</span>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  value="single"
                  checked={scope === "single"}
                  onChange={() => setScope("single")}
                />
                <span>Apenas este agendamento</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  value="series"
                  checked={scope === "series"}
                  onChange={() => setScope("series")}
                />
                <span>Toda a série de recorrência</span>
              </label>
            </div>
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">PIN (4 dígitos)</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={cn(
                "rounded-md border bg-white px-3 py-2 text-base tracking-[0.4em] outline-none transition-colors dark:bg-slate-950",
                error
                  ? "border-red-400 focus:ring-1 focus:ring-red-400"
                  : "border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 dark:border-slate-700",
              )}
              placeholder="••••"
            />
            {error && <span className="text-xs text-red-600">{error}</span>}
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? "..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
