import type { User as PrivyUser } from "@privy-io/server-auth";

declare global {
  namespace Express {
    interface Request {
      privyUserId?: string;
      privyUser?: PrivyUser;
    }
  }
}

export {};
