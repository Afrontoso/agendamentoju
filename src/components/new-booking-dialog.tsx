"use client";

import { useEffect, useState, useTransition } from "react";
import { bookingFormSchema } from "@/schemas/booking";
import { createBooking } from "@/server/actions";
import { toast } from "@/components/toaster";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  defaultDate: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  onOpenChange: (open: boolean) => void;
};

type FieldErrors = Partial<
  Record<"name" | "title" | "date" | "startTime" | "endTime", string>
>;

export function NewBookingDialog({
  open,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  onOpenChange,
}: Props) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultStartTime ?? "09:00");
  const [endTime, setEndTime] = useState(defaultEndTime ?? "10:00");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setDate(defaultDate);
      setStartTime(defaultStartTime ?? "09:00");
      setEndTime(defaultEndTime ?? "10:00");
      setErrors({});
    }
  }, [open, defaultDate, defaultStartTime, defaultEndTime]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const values = { name, title, date, startTime, endTime };
    const parsed = bookingFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await createBooking(parsed.data);
      if (result.ok) {
        toast("success", "Agendamento criado");
        onOpenChange(false);
        setName("");
        setTitle("");
      } else {
        toast("error", result.error);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Novo agendamento</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Field label="Seu nome" error={errors.name}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={80}
              className={inputClass(!!errors.name)}
              placeholder="Ex: Victor"
            />
          </Field>

          <Field label="Assunto da reunião" error={errors.title}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className={inputClass(!!errors.title)}
              placeholder="Ex: Alinhamento semanal"
            />
          </Field>

          <Field label="Data" error={errors.date}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass(!!errors.date)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Início" error={errors.startTime}>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass(!!errors.startTime)}
              />
            </Field>
            <Field label="Fim" error={errors.endTime}>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass(!!errors.endTime)}
              />
            </Field>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? "Salvando..." : "Agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700 dark:text-slate-200">
        {label}
      </span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors dark:bg-slate-950",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400"
      : "border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 dark:border-slate-700",
  );
}
