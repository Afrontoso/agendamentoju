"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { generateOccurrences } from "@/lib/bookings";
import { hashPin, verifyPin } from "@/lib/pin";
import {
  createBookingSchema,
  deleteBookingSchema,
  updateBookingSchema,
  type CreateBookingValues,
  type DeleteBookingValues,
  type UpdateBookingValues,
} from "@/schemas/booking";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

function combine(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

function firstZodIssue<T extends { error: { issues: { message: string }[] } }>(
  parsed: T,
) {
  return parsed.error.issues[0]?.message ?? "Dados inválidos";
}

export async function createBooking(
  input: CreateBookingValues,
): Promise<ActionResult> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodIssue(parsed) };
  }
  const { name, title, date, startTime, endTime, pin, recurrence } = parsed.data;
  const occurrences = generateOccurrences(date, startTime, endTime, recurrence);

  try {
    for (const occ of occurrences) {
      const conflict = await prisma.booking.findFirst({
        where: {
          startsAt: { lt: occ.endsAt },
          endsAt: { gt: occ.startsAt },
        },
        select: { id: true, startsAt: true },
      });
      if (conflict) {
        const when = format(conflict.startsAt, "dd/MM HH:mm");
        return {
          ok: false,
          error:
            occurrences.length === 1
              ? "Horário já ocupado nessa janela"
              : `Conflito em ${when} — recorrência cancelada`,
        };
      }
    }

    const pinHash = hashPin(pin);
    const seriesId = occurrences.length > 1 ? crypto.randomUUID() : null;

    await prisma.booking.createMany({
      data: occurrences.map((o) => ({
        name,
        title,
        startsAt: o.startsAt,
        endsAt: o.endsAt,
        pinHash,
        seriesId,
      })),
    });

    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    console.error("createBooking error", err);
    return { ok: false, error: "Erro ao salvar agendamento" };
  }
}

export async function updateBooking(
  input: UpdateBookingValues,
): Promise<ActionResult> {
  const parsed = updateBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodIssue(parsed) };
  }
  const { id, name, title, date, startTime, endTime, pin } = parsed.data;

  try {
    const current = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, pinHash: true },
    });
    if (!current) return { ok: false, error: "Agendamento não encontrado" };
    if (!verifyPin(pin, current.pinHash)) {
      return { ok: false, error: "PIN incorreto" };
    }

    const startsAt = combine(date, startTime);
    const endsAt = combine(date, endTime);

    const conflict = await prisma.booking.findFirst({
      where: {
        id: { not: id },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      select: { id: true },
    });
    if (conflict) {
      return { ok: false, error: "Horário já ocupado nessa janela" };
    }

    await prisma.booking.update({
      where: { id },
      data: { name, title, startsAt, endsAt },
    });

    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    console.error("updateBooking error", err);
    return { ok: false, error: "Erro ao atualizar agendamento" };
  }
}

export async function deleteBooking(
  input: DeleteBookingValues,
): Promise<ActionResult> {
  const parsed = deleteBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodIssue(parsed) };
  }
  const { id, pin, scope } = parsed.data;

  try {
    const target = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, pinHash: true, seriesId: true },
    });
    if (!target) return { ok: false, error: "Agendamento não encontrado" };
    if (!verifyPin(pin, target.pinHash)) {
      return { ok: false, error: "PIN incorreto" };
    }

    if (scope === "series" && target.seriesId) {
      await prisma.booking.deleteMany({
        where: { seriesId: target.seriesId },
      });
    } else {
      await prisma.booking.delete({ where: { id } });
    }

    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    console.error("deleteBooking error", err);
    return { ok: false, error: "Erro ao excluir agendamento" };
  }
}
