import { z } from "zod";
import "dotenv/config";

const ethAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "invalid Ethereum address")
  .optional();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),

  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((s) =>
      s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    ),

  TERRAVIO_API_KEY: z.string().optional(),
  PRIVY_APP_ID: z.string().optional(),
  PRIVY_APP_SECRET: z.string().optional(),
  DEV_SKIP_AUTH: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),

  CHAIN_ID: z.coerce.number().default(84532),
  BASE_RPC_URL: z.string().url().optional(),

  GOLD_TOKEN_ADDRESS: ethAddress,
  PROPERTY_TOKEN_ADDRESS: ethAddress,
  CARBON_TOKEN_ADDRESS: ethAddress,

  KYC_MANAGER_PRIVATE_KEY: z
    .string()
    .regex(/^(0x)?[a-fA-F0-9]{64}$/)
    .optional()
    .transform((k) => (k?.startsWith("0x") ? k : k ? `0x${k}` : undefined)),

  DIDIT_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${msg}`);
  }
  cached = parsed.data;
  return parsed.data;
}
