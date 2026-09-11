import { z } from "zod";

export const checkInSchema = z.object({
  shiftId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  notes: z.string().optional(),
});

export const createShiftSchema = z.object({
  name: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  gracePeriodMins: z.number().int().optional(),
});

export const createHolidaySchema = z.object({
  name: z.string().min(1),
  date: z.string().datetime(),
});
