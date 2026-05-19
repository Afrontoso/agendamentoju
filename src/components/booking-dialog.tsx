"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createBookingSchema,
  updateBookingSchema,
} from "@/schemas/booking";
import { createBooking, updateBooking } from "@/server/actions";
import { toast } from "@/components/toaster";
import { cn } from "@/lib/utils";

export type DialogMode =
  | {
      kind: "create";
      defaultDate: string;
      defaultStartTime?: string;
      defaultEndTime?: string;
    }
  | {
      kind: "edit";
      id: string;
      defaultName: string;
      defaultTitle: string;
      defaultDate: string;
      defaultStartTime: string;
      defaultEndTime: string;
    };

type FieldErrors = Partial<
  Record<
    | "name"
    | "title"
    | "date"
    | "startTime"
    | "endTime"
    | "pin"
    | "recurrenceUntil",
    string
  >
>;

type Props = {
  mode: DialogMode;
  onClose: () => void;
};

type Frequency = "none" | "weekly" | "monthly";

export function BookingDialog({ mode, onClose }: Props) {
  const isEdit = mode.kind === "edit";

  const [name, setName] = useState(isEdit ? mode.defaultName : "");
  const [title, setTitle] = useState(isEdit ? mode.defaultTitle : "");
  const [date, setDate] = useState(mode.defaultDate);
  const [startTime, setStartTime] = useState(
    isEdit ? mode.defaultStartTime : (mode.defaultStartTime ?? "09:00"),
  );
  const [endTime, setEndTime] = useState(
    isEdit ? mode.defaultEndTime : (mode.defaultEndTime ?? "10:00"),
  );
  const [pin, setPin] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("none");
  const [until, setUntil] = useState(mode.defaultDate);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode.kind === "create") {
      const recurrence =
        frequency === "none"
          ? { kind: "none" as const }
          : frequency === "weekly"
            ? { kind: "weekly" as const, until }
            : { kind: "monthly" as const, until };

      const values = { name, title, date, startTime, endTime, pin, recurrence };
      const parsed = createBookingSchema.safeParse(values);
      if (!parsed.success) {
        setErrors(collectErrors(parsed.error.issues));
        return;
      }
      setErrors({});
      startTransition(async () => {
        const result = await createBooking(parsed.data);
        if (result.ok) {
          toast("success", "Agendamento criado");
          onClose();
        } else {
          toast("error", result.error);
        }
      });
    } else {
      const values = { id: mode.id, name, title, date, startTime, endTime, pin };
      const parsed = updateBookingSchema.safeParse(values);
      if (!parsed.success) {
        setErrors(collectErrors(parsed.error.issues));
        return;
      }
      setErrors({});
      startTransition(async () => {
        const result = await updateBooking(parsed.data);
        if (result.ok) {
          toast("success", "Agendamento atualizado");
          onClose();
        } else {
          toast("error", result.error);
        }
      });
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Editar agendamento" : "Novo agendamento"}
          </h2>
          <button
            type="button"
            onClick={onClose}
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
              autoFocus={!isEdit}
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

          {!isEdit && (
            <div className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
              <Field label="Recorrência">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as Frequency)}
                  className={inputClass(false)}
                >
                  <option value="none">Não repetir</option>
                  <option value="weekly">Toda semana</option>
                  <option value="monthly">Todo mês</option>
                </select>
              </Field>
              {frequency !== "none" && (
                <div className="mt-2">
                  <Field label="Repetir até" error={errors.recurrenceUntil}>
                    <input
                      type="date"
                      value={until}
                      min={date}
                      onChange={(e) => setUntil(e.target.value)}
                      className={inputClass(!!errors.recurrenceUntil)}
                    />
                  </Field>
                  <p className="mt-1 text-xs text-slate-500">
                    Máx 52 ocorrências. Se houver conflito em alguma data, nada
                    é criado.
                  </p>
                </div>
              )}
            </div>
          )}

          <Field
            label={isEdit ? "PIN do agendamento" : "Defina um PIN de 4 dígitos"}
            error={errors.pin}
          >
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              maxLength={4}
              className={cn(inputClass(!!errors.pin), "tracking-[0.4em]")}
              placeholder="••••"
            />
          </Field>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? "Salvando..." : isEdit ? "Salvar" : "Agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function collectErrors(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): FieldErrors {
  const next: FieldErrors = {};
  for (const issue of issues) {
    const path = issue.path;
    let key: keyof FieldErrors | undefined;
    if (path[0] === "recurrence" && path[1] === "until") {
      key = "recurrenceUntil";
    } else if (typeof path[0] === "string") {
      key = path[0] as keyof FieldErrors;
    }
    if (key && !next[key]) next[key] = issue.message;
  }
  return next;
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
