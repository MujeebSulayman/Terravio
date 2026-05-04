import type { User as PrivyUser } from "@privy-io/node";

declare global {
  namespace Express {
    interface Request {
      privyUserId?: string;
      privyUser?: PrivyUser;
    }
  }
}

export {};
