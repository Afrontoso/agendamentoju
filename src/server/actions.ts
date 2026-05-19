"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { bookingFormSchema, type BookingFormValues } from "@/schemas/booking";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

function combine(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export async function createBooking(
  input: BookingFormValues,
): Promise<ActionResult> {
  const parsed = bookingFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { name, title, date, startTime, endTime } = parsed.data;
  const startsAt = combine(date, startTime);
  const endsAt = combine(date, endTime);

  try {
    const conflict = await prisma.booking.findFirst({
      where: {
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      select: { id: true },
    });
    if (conflict) {
      return { ok: false, error: "Horário já ocupado nessa janela" };
    }

    await prisma.booking.create({
      data: { name, title, startsAt, endsAt },
    });

    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    console.error("createBooking error", err);
    return { ok: false, error: "Erro ao salvar agendamento" };
  }
}

export async function deleteBooking(id: string): Promise<ActionResult> {
  if (!id || typeof id !== "string") {
    return { ok: false, error: "ID inválido" };
  }
  try {
    await prisma.booking.delete({ where: { id } });
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    console.error("deleteBooking error", err);
    return { ok: false, error: "Erro ao excluir agendamento" };
  }
}
