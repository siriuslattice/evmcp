import { z } from "zod";

const booleanString = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === "boolean") return val;
    return val.toLowerCase() === "true" || val === "1";
  })
  .default(false);

const envSchema = z
  .object({
    ALCHEMY_API_KEY: z.string().min(1).optional(),
    ETHEREUM_RPC_URL: z.string().url().optional(),
    BASE_RPC_URL: z.string().url().optional(),
    OPTIMISM_RPC_URL: z.string().url().optional(),
    AVALANCHE_RPC_URL: z.string().url().optional(),
    CELO_RPC_URL: z.string().url().optional(),
    CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(15),
    CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(1000),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    USE_TESTNETS: booleanString,
  })
  .refine(
    (data) =>
      data.ALCHEMY_API_KEY ||
      (data.BASE_RPC_URL && data.OPTIMISM_RPC_URL && data.AVALANCHE_RPC_URL && data.CELO_RPC_URL),
    { message: "Provide ALCHEMY_API_KEY or all four individual chain RPC URLs" },
  );

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  return envSchema.parse(process.env);
}
