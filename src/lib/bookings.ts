import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";

export const WORK_START_HOUR = 8;
export const WORK_END_HOUR = 18;

export type BookingRow = {
  id: string;
  name: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
};

export type FreeSlot = {
  startsAt: Date;
  endsAt: Date;
};

export async function getBookingsByDay(day: Date): Promise<BookingRow[]> {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);

  return prisma.booking.findMany({
    where: {
      startsAt: { lt: dayEnd },
      endsAt: { gt: dayStart },
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      name: true,
      title: true,
      startsAt: true,
      endsAt: true,
    },
  });
}

export async function getDaysWithBookingsInRange(from: Date, to: Date) {
  const rows = await prisma.booking.findMany({
    where: {
      startsAt: { lt: to },
      endsAt: { gt: from },
    },
    select: { startsAt: true },
  });
  const set = new Set<string>();
  for (const r of rows) {
    const d = r.startsAt;
    set.add(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }
  return set;
}

export function computeFreeSlots(
  bookings: Pick<BookingRow, "startsAt" | "endsAt">[],
  day: Date,
): FreeSlot[] {
  const dayBase = startOfDay(day);
  const workStart = new Date(dayBase);
  workStart.setHours(WORK_START_HOUR, 0, 0, 0);
  const workEnd = new Date(dayBase);
  workEnd.setHours(WORK_END_HOUR, 0, 0, 0);

  const clipped = bookings
    .map((b) => ({
      startsAt: b.startsAt < workStart ? workStart : b.startsAt,
      endsAt: b.endsAt > workEnd ? workEnd : b.endsAt,
    }))
    .filter((b) => b.startsAt < b.endsAt)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const merged: FreeSlot[] = [];
  for (const b of clipped) {
    const last = merged[merged.length - 1];
    if (last && b.startsAt <= last.endsAt) {
      if (b.endsAt > last.endsAt) last.endsAt = b.endsAt;
    } else {
      merged.push({ startsAt: b.startsAt, endsAt: b.endsAt });
    }
  }

  const free: FreeSlot[] = [];
  let cursor = workStart;
  for (const m of merged) {
    if (m.startsAt > cursor) {
      free.push({ startsAt: cursor, endsAt: m.startsAt });
    }
    if (m.endsAt > cursor) cursor = m.endsAt;
  }
  if (cursor < workEnd) free.push({ startsAt: cursor, endsAt: workEnd });

  return free;
}

export function parseDateParam(raw: string | undefined | null): Date {
  if (!raw) return startOfDay(new Date());
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return startOfDay(new Date());
  const [, y, m, d] = match;
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  if (Number.isNaN(dt.getTime())) return startOfDay(new Date());
  return startOfDay(dt);
}

export function formatDateParam(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
