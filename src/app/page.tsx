import { format, endOfMonth, startOfMonth, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
  WORK_END_HOUR,
  WORK_START_HOUR,
  computeFreeSlots,
  formatDateParam,
  getBookingsByDay,
  getBookingsByWeek,
  getDaysWithBookingsInRange,
  parseDateParam,
} from "@/lib/bookings";
import { BookingCalendar } from "@/components/booking-calendar";
import { DayAgenda } from "@/components/day-agenda";
import { WeekGrid } from "@/components/week-grid";
import { ViewToggle } from "@/components/view-toggle";

type SearchParams = Promise<{ date?: string; view?: string }>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const selected = parseDateParam(params.date);
  const view: "day" | "week" = params.view === "week" ? "week" : "day";

  const monthStart = startOfMonth(selected);
  const monthEnd = endOfMonth(selected);

  const [dayBookings, weekBookings, busyDaySet] = await Promise.all([
    view === "day" ? getBookingsByDay(selected) : Promise.resolve([]),
    view === "week" ? getBookingsByWeek(selected) : Promise.resolve([]),
    getDaysWithBookingsInRange(monthStart, monthEnd),
  ]);

  const free = view === "day" ? computeFreeSlots(dayBookings, selected) : [];
  const weekStart = startOfWeek(selected, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sala de Reunião</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Veja o que está livre e reserve um horário. Expediente:{" "}
          {String(WORK_START_HOUR).padStart(2, "0")}:00 às{" "}
          {String(WORK_END_HOUR).padStart(2, "0")}:00.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
            Calendário
          </h2>
          <BookingCalendar
            selectedDate={formatDateParam(selected)}
            busyDays={Array.from(busyDaySet)}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              {view === "day" ? (
                <>
                  <h2 className="text-lg font-semibold capitalize">
                    {format(selected, "EEEE, dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {dayBookings.length === 0
                      ? "Nenhum agendamento ainda"
                      : `${dayBookings.length} agendamento${dayBookings.length > 1 ? "s" : ""}`}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">
                    Semana de {format(weekStart, "dd/MM")} a{" "}
                    {format(weekEnd, "dd/MM/yyyy")}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {weekBookings.length} agendamento
                    {weekBookings.length === 1 ? "" : "s"} na semana
                  </p>
                </>
              )}
            </div>
            <ViewToggle current={view} />
          </div>

          {view === "day" ? (
            <DayAgenda
              dateParam={formatDateParam(selected)}
              bookings={dayBookings.map((b) => ({
                id: b.id,
                name: b.name,
                title: b.title,
                startsAt: b.startsAt.toISOString(),
                endsAt: b.endsAt.toISOString(),
                seriesId: b.seriesId,
              }))}
              freeSlots={free.map((f) => ({
                startsAt: f.startsAt.toISOString(),
                endsAt: f.endsAt.toISOString(),
              }))}
            />
          ) : (
            <WeekGrid
              anchorDate={formatDateParam(selected)}
              workStartHour={WORK_START_HOUR}
              workEndHour={WORK_END_HOUR}
              bookings={weekBookings.map((b) => ({
                id: b.id,
                name: b.name,
                title: b.title,
                startsAt: b.startsAt.toISOString(),
                endsAt: b.endsAt.toISOString(),
                seriesId: b.seriesId,
              }))}
            />
          )}
        </section>
      </div>
    </main>
  );
}
