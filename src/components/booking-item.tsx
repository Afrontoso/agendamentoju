"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { deleteBooking } from "@/server/actions";
import { toast } from "@/components/toaster";
import { BookingDialog } from "@/components/booking-dialog";
import { PinPrompt } from "@/components/pin-prompt";

type Props = {
  id: string;
  name: string;
  title: string;
  startsAt: string;
  endsAt: string;
  seriesId: string | null;
};

export function BookingItem({
  id,
  name,
  title,
  startsAt,
  endsAt,
  seriesId,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const start = new Date(startsAt);
  const end = new Date(endsAt);

  function onConfirmDelete(pin: string, scope: "single" | "series") {
    startTransition(async () => {
      const result = await deleteBooking({ id, pin, scope });
      if (result.ok) {
        toast("success", "Agendamento excluído");
        setPinOpen(false);
      } else {
        toast("error", result.error);
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/60 dark:bg-red-950/40">
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-block h-2 w-2 rounded-full bg-red-500" />
          <div>
            <p className="font-medium text-red-950 dark:text-red-100">
              {title}
              {seriesId && (
                <span className="ml-2 rounded bg-red-200/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-800 dark:bg-red-900/70 dark:text-red-200">
                  série
                </span>
              )}
            </p>
            <p className="text-xs text-red-900/80 dark:text-red-200/80">
              {format(start, "HH:mm", { locale: ptBR })} –{" "}
              {format(end, "HH:mm", { locale: ptBR })} · {name}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900/40"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setPinOpen(true)}
            disabled={pending}
            className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900/40"
          >
            {pending ? "..." : "Excluir"}
          </button>
        </div>
      </div>

      {editing && (
        <BookingDialog
          mode={{
            kind: "edit",
            id,
            defaultName: name,
            defaultTitle: title,
            defaultDate: format(start, "yyyy-MM-dd"),
            defaultStartTime: format(start, "HH:mm"),
            defaultEndTime: format(end, "HH:mm"),
          }}
          onClose={() => setEditing(false)}
        />
      )}

      {pinOpen && (
        <PinPrompt
          title="Excluir agendamento"
          description="Digite o PIN definido na criação."
          pending={pending}
          showScopeChoice={!!seriesId}
          onCancel={() => setPinOpen(false)}
          onConfirm={onConfirmDelete}
        />
      )}
    </>
  );
}
