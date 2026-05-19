"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { deleteBooking } from "@/server/actions";
import { toast } from "@/components/toaster";

type Props = {
  id: string;
  name: string;
  title: string;
  startsAt: string;
  endsAt: string;
};

export function BookingItem({ id, name, title, startsAt, endsAt }: Props) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!window.confirm("Excluir este agendamento?")) return;
    startTransition(async () => {
      const result = await deleteBooking(id);
      if (result.ok) {
        toast("success", "Agendamento excluído");
      } else {
        toast("error", result.error);
      }
    });
  }

  const start = new Date(startsAt);
  const end = new Date(endsAt);

  return (
    <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/60 dark:bg-red-950/40">
      <div className="flex items-start gap-3">
        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-red-500" />
        <div>
          <p className="font-medium text-red-950 dark:text-red-100">{title}</p>
          <p className="text-xs text-red-900/80 dark:text-red-200/80">
            {format(start, "HH:mm", { locale: ptBR })} –{" "}
            {format(end, "HH:mm", { locale: ptBR })} · {name}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900/40"
      >
        {pending ? "..." : "Excluir"}
      </button>
    </div>
  );
}
