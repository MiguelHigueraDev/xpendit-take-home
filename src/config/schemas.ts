import { z } from "zod";
import { parseOrThrow } from "../validation/parse.js";

/** Environment variables required by the application. */
export const envSchema = z.object({
  OPEN_EXCHANGE_RATES_APP_ID: z
    .string()
    .trim()
    .min(1, "OPEN_EXCHANGE_RATES_APP_ID is not set. Copy .env.example to .env and add your API key."),
});

export type Env = z.infer<typeof envSchema>;

/** Validates process environment variables. */
export function parseEnv(input: unknown): Env {
  return parseOrThrow(envSchema, input);
}
