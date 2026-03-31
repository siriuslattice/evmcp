import { z } from "zod";

const booleanString = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === "boolean") return val;
    return val.toLowerCase() === "true" || val === "1";
  })
  .default(false);

// Transform empty strings to undefined so dotenv's KEY= doesn't fail .url()
const optionalUrl = z
  .union([z.string(), z.undefined()])
  .transform((val) => (val === "" || val === undefined ? undefined : val))
  .pipe(z.string().url().optional());

const optionalNonEmpty = z
  .union([z.string(), z.undefined()])
  .transform((val) => (val === "" || val === undefined ? undefined : val))
  .pipe(z.string().min(1).optional());

const envSchema = z
  .object({
    ALCHEMY_API_KEY: optionalNonEmpty,
    ETHEREUM_RPC_URL: optionalUrl,
    BASE_RPC_URL: optionalUrl,
    OPTIMISM_RPC_URL: optionalUrl,
    AVALANCHE_RPC_URL: optionalUrl,
    CELO_RPC_URL: optionalUrl,
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
