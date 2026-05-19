"use client";

import { useState } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { BookingDialog } from "@/components/booking-dialog";
import { BookingItem } from "@/components/booking-item";
import { cn } from "@/lib/utils";

type BookingDTO = {
  id: string;
  name: string;
  title: string;
  startsAt: string;
  endsAt: string;
  seriesId: string | null;
};

type Props = {
  anchorDate: string;
  workStartHour: number;
  workEndHour: number;
  bookings: BookingDTO[];
};

function parseISODate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function WeekGrid({
  anchorDate,
  workStartHour,
  workEndHour,
  bookings,
}: Props) {
  const anchor = parseISODate(anchorDate);
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from(
    { length: workEndHour - workStartHour + 1 },
    (_, i) => workStartHour + i,
  );

  const [createState, setCreateState] = useState<{
    open: boolean;
    date: string;
    startTime: string;
    endTime: string;
  }>({ open: false, date: anchorDate, startTime: "09:00", endTime: "10:00" });

  const [selected, setSelected] = useState<BookingDTO | null>(null);

  const today = new Date();

  function openNewAt(day: Date, hour: number) {
    setCreateState({
      open: true,
      date: toISODate(day),
      startTime: `${String(hour).padStart(2, "0")}:00`,
      endTime: `${String(hour + 1).padStart(2, "0")}:00`,
    });
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[700px] grid-cols-[60px_repeat(7,1fr)] gap-px bg-slate-200 dark:bg-slate-800">
        <div className="bg-white p-2 dark:bg-slate-900" />
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <div
              key={d.toISOString()}
              className={cn(
                "bg-white p-2 text-center text-xs font-medium dark:bg-slate-900",
                isToday && "text-blue-600 dark:text-blue-400",
              )}
            >
              <div className="uppercase">
                {format(d, "EEE", { locale: ptBR })}
              </div>
              <div className="text-sm font-semibold">{format(d, "dd/MM")}</div>
            </div>
          );
        })}

        {hours.slice(0, -1).map((h) => (
          <DurationRow
            key={h}
            hour={h}
            days={days}
            bookings={bookings}
            onCreate={openNewAt}
            onSelectBooking={setSelected}
          />
        ))}
      </div>

      {createState.open && (
        <BookingDialog
          mode={{
            kind: "create",
            defaultDate: createState.date,
            defaultStartTime: createState.startTime,
            defaultEndTime: createState.endTime,
          }}
          onClose={() => setCreateState((s) => ({ ...s, open: false }))}
        />
      )}

      {selected && (
        <SelectedBookingActions
          booking={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function DurationRow({
  hour,
  days,
  bookings,
  onCreate,
  onSelectBooking,
}: {
  hour: number;
  days: Date[];
  bookings: BookingDTO[];
  onCreate: (day: Date, hour: number) => void;
  onSelectBooking: (b: BookingDTO) => void;
}) {
  return (
    <>
      <div className="bg-white px-2 py-3 text-right text-xs text-slate-500 dark:bg-slate-900">
        {String(hour).padStart(2, "0")}:00
      </div>
      {days.map((d) => {
        const cellStart = new Date(d);
        cellStart.setHours(hour, 0, 0, 0);
        const cellEnd = new Date(d);
        cellEnd.setHours(hour + 1, 0, 0, 0);
        const overlapping = bookings.filter((b) => {
          const bs = new Date(b.startsAt);
          const be = new Date(b.endsAt);
          return bs < cellEnd && be > cellStart;
        });
        const isStartHour = overlapping.find((b) => {
          const bs = new Date(b.startsAt);
          return bs.getHours() === hour && isSameDay(bs, d);
        });
        return (
          <div
            key={`${d.toISOString()}-${hour}`}
            className="relative min-h-[56px] bg-white dark:bg-slate-900"
          >
            {overlapping.length === 0 ? (
              <button
                type="button"
                onClick={() => onCreate(d, hour)}
                className="absolute inset-0.5 rounded-sm border border-dashed border-transparent text-[10px] text-transparent transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                aria-label={`Agendar ${format(d, "dd/MM")} ${hour}:00`}
              >
                + agendar
              </button>
            ) : isStartHour ? (
              <BookingChip booking={isStartHour} onClick={() => onSelectBooking(isStartHour)} />
            ) : (
              <div className="absolute inset-0.5 rounded-sm bg-red-100/60 dark:bg-red-950/40" />
            )}
          </div>
        );
      })}
    </>
  );
}

function BookingChip({
  booking,
  onClick,
}: {
  booking: BookingDTO;
  onClick: () => void;
}) {
  const start = new Date(booking.startsAt);
  const end = new Date(booking.endsAt);
  const durationMinutes = (end.getTime() - start.getTime()) / 60000;
  const heightUnits = Math.max(durationMinutes / 60, 1);
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute inset-x-0.5 top-0.5 z-10 overflow-hidden rounded-sm border border-red-300 bg-red-100 px-1.5 py-1 text-left text-[11px] leading-tight text-red-900 hover:bg-red-200 dark:border-red-800 dark:bg-red-950 dark:text-red-100 dark:hover:bg-red-900"
      style={{ height: `calc(${heightUnits} * 56px - 4px)` }}
    >
      <div className="truncate font-semibold">{booking.title}</div>
      <div className="truncate opacity-80">
        {format(start, "HH:mm")}–{format(end, "HH:mm")} · {booking.name}
      </div>
    </button>
  );
}

function SelectedBookingActions({
  booking,
  onClose,
}: {
  booking: BookingDTO;
  onClose: () => void;
}) {
  const start = new Date(booking.startsAt);
  const end = new Date(booking.endsAt);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-3 text-xs text-slate-500">
          {format(start, "dd/MM/yyyy")} · {format(start, "HH:mm")} –{" "}
          {format(end, "HH:mm")}
        </p>
        <BookingItem
          id={booking.id}
          name={booking.name}
          title={booking.title}
          startsAt={booking.startsAt}
          endsAt={booking.endsAt}
          seriesId={booking.seriesId}
        />
      </div>
    </div>
  );
}
