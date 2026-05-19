"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { BookingItem } from "@/components/booking-item";
import { BookingDialog } from "@/components/booking-dialog";

type BookingDTO = {
  id: string;
  name: string;
  title: string;
  startsAt: string;
  endsAt: string;
  seriesId: string | null;
};

type FreeSlotDTO = {
  startsAt: string;
  endsAt: string;
};

type Props = {
  dateParam: string;
  bookings: BookingDTO[];
  freeSlots: FreeSlotDTO[];
};

type Block =
  | { kind: "busy"; data: BookingDTO }
  | { kind: "free"; data: FreeSlotDTO };

export function DayAgenda({ dateParam, bookings, freeSlots }: Props) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    startTime?: string;
    endTime?: string;
  }>({ open: false });

  const blocks: Block[] = [
    ...bookings.map((b) => ({ kind: "busy" as const, data: b })),
    ...freeSlots.map((f) => ({ kind: "free" as const, data: f })),
  ].sort((a, b) => {
    const sa = new Date(a.data.startsAt).getTime();
    const sb = new Date(b.data.startsAt).getTime();
    return sa - sb;
  });

  function openNew(startTime?: string, endTime?: string) {
    setDialogState({ open: true, startTime, endTime });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => openNew()}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Novo agendamento
        </button>
      </div>

      <ol className="flex flex-col gap-2">
        {blocks.length === 0 && (
          <li className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
            O dia inteiro está livre. Clique em &ldquo;Novo agendamento&rdquo;
            para reservar.
          </li>
        )}
        {blocks.map((block, idx) => {
          if (block.kind === "busy") {
            return (
              <li key={`busy-${block.data.id}`}>
                <BookingItem
                  id={block.data.id}
                  name={block.data.name}
                  title={block.data.title}
                  startsAt={block.data.startsAt}
                  endsAt={block.data.endsAt}
                  seriesId={block.data.seriesId}
                />
              </li>
            );
          }
          const start = new Date(block.data.startsAt);
          const end = new Date(block.data.endsAt);
          const startHHMM = format(start, "HH:mm", { locale: ptBR });
          const endHHMM = format(end, "HH:mm", { locale: ptBR });
          return (
            <li key={`free-${idx}-${block.data.startsAt}`}>
              <button
                type="button"
                onClick={() => openNew(startHHMM, endHHMM)}
                className="flex w-full items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm transition-colors hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:hover:bg-emerald-900"
              >
                <span className="flex items-center gap-3">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-emerald-900 dark:text-emerald-100">
                    Livre: {startHHMM} – {endHHMM}
                  </span>
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-300">
                  Agendar este horário →
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {dialogState.open && (
        <BookingDialog
          mode={{
            kind: "create",
            defaultDate: dateParam,
            defaultStartTime: dialogState.startTime,
            defaultEndTime: dialogState.endTime,
          }}
          onClose={() => setDialogState((s) => ({ ...s, open: false }))}
        />
      )}
    </div>
  );
}
