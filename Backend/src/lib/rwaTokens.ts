import type { Env } from "../config/env";

export type RwaTokenConfig = {
  address: string;
  /** Must match EIP-712 domain name in token's `__EIP712_init`. */
  eip712Name: string;
};

export function getConfiguredRwaTokens(env: Env): RwaTokenConfig[] {
  const out: RwaTokenConfig[] = [];
  if (env.GOLD_TOKEN_ADDRESS) {
    out.push({ address: env.GOLD_TOKEN_ADDRESS, eip712Name: "Terravio Gold" });
  }
  if (env.PROPERTY_TOKEN_ADDRESS) {
    out.push({ address: env.PROPERTY_TOKEN_ADDRESS, eip712Name: "Terravio Property" });
  }
  if (env.CARBON_TOKEN_ADDRESS) {
    out.push({ address: env.CARBON_TOKEN_ADDRESS, eip712Name: "Terravio Carbon" });
  }
  return out;
}
