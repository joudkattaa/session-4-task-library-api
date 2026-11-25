import "dotenv/config";
import { z } from "zod";

const portSchema = z.string().regex(/^\d+$/).transform(Number).pipe(
  z.number().int().min(1).max(65535),
);

const result = portSchema.safeParse(process.env.PORT ?? "3000");
if (!result.success) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

export const PORT = result.data;
