import { z } from "zod";
import "dotenv/config";

const emptyToUndef = (v: unknown) => (v === "" || v === undefined ? undefined : v);

const ethAddress = z.preprocess(
  emptyToUndef,
  z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "invalid Ethereum address")
    .optional()
);

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

  TERRAVIO_API_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  /** RentCast server-side key for property valuation lookups. */
  RENTCAST_API_KEY: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  PRIVY_APP_ID: z.preprocess(emptyToUndef, z.string().optional()),
  PRIVY_APP_SECRET: z.preprocess(emptyToUndef, z.string().optional()),
  /** Override default `https://api.privy.io` (JWKS + REST). */
  PRIVY_API_BASE_URL: z.preprocess(emptyToUndef, z.string().url().optional()),
  /**
   * Optional SPKI verification key from Privy dashboard (skips remote JWKS if set).
   * `createPrivyAppJWKS` accepts this as `verificationKeyOverride`.
   */
  PRIVY_JWT_VERIFICATION_KEY: z.preprocess(emptyToUndef, z.string().optional()),
  DEV_SKIP_AUTH: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),

  CHAIN_ID: z.coerce.number().default(84532),
  BASE_RPC_URL: z.preprocess(emptyToUndef, z.string().url().optional()),

  GOLD_TOKEN_ADDRESS: ethAddress,
  PROPERTY_TOKEN_ADDRESS: ethAddress,
  CARBON_TOKEN_ADDRESS: ethAddress,

  KYC_MANAGER_PRIVATE_KEY: z
    .preprocess(emptyToUndef, z.string().optional())
    .transform((k) => {
      if (k === undefined || k === "") return undefined;
      const normalized = k.startsWith("0x") ? k : `0x${k}`;
      if (!/^0x[a-fA-F0-9]{64}$/.test(normalized)) {
        throw new Error("KYC_MANAGER_PRIVATE_KEY must be 32-byte hex");
      }
      return normalized;
    }),

  /** Application id in Didit console (optional; for logging / future checks). */
  DIDIT_APP_ID: z.preprocess(emptyToUndef, z.string().optional()),
  /** Server-side API key: `x-api-key` for https://verification.didit.me/... */
  DIDIT_API_KEY: z.preprocess(emptyToUndef, z.string().optional()),
  /** Default workflow id from console (webhook `workflow_id` must match when set). */
  DIDIT_WORKFLOW_ID: z.preprocess(emptyToUndef, z.string().optional()),
  /** Override Didit API host (default https://verification.didit.me) */
  DIDIT_API_BASE_URL: z.preprocess(emptyToUndef, z.string().url().optional()),
  /** Webhook secret for HMAC (`X-Signature-V2` / `X-Signature-Simple`). */
  DIDIT_WEBHOOK_SECRET: z.preprocess(emptyToUndef, z.string().optional()),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("AVAILABLE ENV KEYS:", Object.keys(process.env));
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${msg}`);
  }
  cached = parsed.data;
  return parsed.data;
}
