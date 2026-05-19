"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { cn } from "@/lib/utils";

type Props = {
  selectedDate: string;
  busyDays: string[];
};

function parseISODate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BookingCalendar({ selectedDate, busyDays }: Props) {
  const router = useRouter();
  const selected = parseISODate(selectedDate);
  const [cursor, setCursor] = useState(selected);

  const busySet = useMemo(() => new Set(busyDays), [busyDays]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const today = new Date();
  const weekHeaders = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  function navigate(target: Date) {
    router.push(`/?date=${toISODate(target)}`);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor((c) => subMonths(c, 1))}
          className="rounded-md border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <div className="text-sm font-medium capitalize">
          {format(cursor, "MMMM yyyy", { locale: ptBR })}
        </div>
        <button
          type="button"
          onClick={() => setCursor((c) => addMonths(c, 1))}
          className="rounded-md border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
        {weekHeaders.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const iso = toISODate(d);
          const inMonth = isSameMonth(d, cursor);
          const isSelected = isSameDay(d, selected);
          const isToday = isSameDay(d, today);
          const isBusy = busySet.has(iso);
          return (
            <button
              key={iso}
              type="button"
              onClick={() => navigate(d)}
              className={cn(
                "relative aspect-square rounded-md text-sm transition-colors",
                inMonth
                  ? "text-slate-900 dark:text-slate-100"
                  : "text-slate-400 dark:text-slate-600",
                "hover:bg-slate-100 dark:hover:bg-slate-800",
                isSelected &&
                  "bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-500",
                isToday &&
                  !isSelected &&
                  "ring-1 ring-blue-500 dark:ring-blue-400",
              )}
            >
              {d.getDate()}
              {isBusy && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" /> com agendamentos
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-600" /> selecionado
        </span>
      </div>
    </div>
  );
}
