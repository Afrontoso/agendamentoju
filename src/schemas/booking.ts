import { z } from "zod";
import { WORK_END_HOUR, WORK_START_HOUR } from "@/lib/bookings";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const bookingFormSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o seu nome").max(80),
    title: z.string().trim().min(2, "Informe o assunto").max(120),
    date: z.string().regex(dateRegex, "Data inválida"),
    startTime: z.string().regex(timeRegex, "Hora inválida"),
    endTime: z.string().regex(timeRegex, "Hora inválida"),
  })
  .superRefine((data, ctx) => {
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
  });

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
