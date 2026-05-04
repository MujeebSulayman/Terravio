import { PrivyClient } from "@privy-io/node";
import type { Env } from "../config/env";

let client: PrivyClient | null = null;

export function getPrivyClient(env: Env): PrivyClient | null {
  if (!env.PRIVY_APP_ID || !env.PRIVY_APP_SECRET) {
    return null;
  }
  if (!client) {
    client = new PrivyClient({
      appId: env.PRIVY_APP_ID,
      appSecret: env.PRIVY_APP_SECRET,
      ...(env.PRIVY_API_BASE_URL ? { apiUrl: env.PRIVY_API_BASE_URL } : {}),
      ...(env.PRIVY_JWT_VERIFICATION_KEY ? { jwtVerificationKey: env.PRIVY_JWT_VERIFICATION_KEY } : {}),
    });
  }
  return client;
}
