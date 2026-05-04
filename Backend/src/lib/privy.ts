import { PrivyClient } from "@privy-io/server-auth";
import type { Env } from "../config/env";

let client: PrivyClient | null = null;

export function getPrivyClient(env: Env): PrivyClient | null {
  if (!env.PRIVY_APP_ID || !env.PRIVY_APP_SECRET) {
    return null;
  }
  if (!client) {
    client = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);
  }
  return client;
}
