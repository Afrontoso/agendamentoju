import { z } from "zod";
import { WORK_END_HOUR, WORK_START_HOUR } from "@/lib/bookings";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const pinRegex = /^\d{4}$/;

export const recurrenceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({
    kind: z.literal("weekly"),
    until: z.string().regex(dateRegex, "Data inválida"),
  }),
  z.object({
    kind: z.literal("monthly"),
    until: z.string().regex(dateRegex, "Data inválida"),
  }),
]);
export type Recurrence = z.infer<typeof recurrenceSchema>;

const baseFields = {
  name: z.string().trim().min(2, "Informe o seu nome").max(80),
  title: z.string().trim().min(2, "Informe o assunto").max(120),
  date: z.string().regex(dateRegex, "Data inválida"),
  startTime: z.string().regex(timeRegex, "Hora inválida"),
  endTime: z.string().regex(timeRegex, "Hora inválida"),
  pin: z.string().regex(pinRegex, "PIN deve ter 4 dígitos"),
};

function refineHours(
  data: { startTime: string; endTime: string },
  ctx: z.RefinementCtx,
) {
  const [sh, sm] = data.startTime.split(":").map(Number);
  const [eh, em] = data.endTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (endMin <= startMin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O horário final deve ser depois do inicial",
      path: ["endTime"],
    });
  }
  if (startMin < WORK_START_HOUR * 60) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Início mínimo: ${String(WORK_START_HOUR).padStart(2, "0")}:00`,
      path: ["startTime"],
    });
  }
  if (endMin > WORK_END_HOUR * 60) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Fim máximo: ${String(WORK_END_HOUR).padStart(2, "0")}:00`,
      path: ["endTime"],
    });
  }
}

export const createBookingSchema = z
  .object({
    ...baseFields,
    recurrence: recurrenceSchema,
  })
  .superRefine((data, ctx) => {
    refineHours(data, ctx);
    if (data.recurrence.kind !== "none") {
      const start = new Date(`${data.date}T00:00:00`);
      const until = new Date(`${data.recurrence.until}T00:00:00`);
      if (until < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Data final da recorrência deve ser depois da inicial",
          path: ["recurrence", "until"],
        });
      }
    }
  });

export type CreateBookingValues = z.infer<typeof createBookingSchema>;

export const updateBookingSchema = z
  .object({
    id: z.string().min(1),
    ...baseFields,
  })
  .superRefine(refineHours);

export type UpdateBookingValues = z.infer<typeof updateBookingSchema>;

export const deleteBookingSchema = z.object({
  id: z.string().min(1),
  pin: z.string().regex(pinRegex, "PIN deve ter 4 dígitos"),
  scope: z.enum(["single", "series"]).optional(),
});

export type DeleteBookingValues = z.infer<typeof deleteBookingSchema>;
