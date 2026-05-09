import { createHash } from "node:crypto";
import { ethers } from "ethers";
import { Router, type Request } from "express";
import axios from "axios";
import type { Env } from "../config/env";
import { verifyDiditWebhookRequest } from "../lib/diditWebhook";
import { HttpError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { fetchDiditSessionDecision } from "../services/diditSessionService";
import { whitelistWalletOnAllTokens } from "../services/whitelistService";
import { requirePrivyAuth } from "../middleware/requirePrivyAuth";

function headerString(req: Request, name: string): string | undefined {
  const v = req.headers[name];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function findEthAddress(value: unknown, depth = 0): string | null {
  if (depth > 10) return null;
  if (typeof value === "string" && /^0x[a-fA-F0-9]{40}$/i.test(value)) return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const v of Object.values(value as Record<string, unknown>)) {
      const w = findEthAddress(v, depth + 1);
      if (w) return w;
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const w = findEthAddress(item, depth + 1);
      if (w) return w;
    }
  }
  return null;
}

function pickWalletFromRecord(body: Record<string, unknown>): string | null {
  const direct =
    (typeof body.wallet_address === "string" && body.wallet_address) ||
    (typeof body.walletAddress === "string" && body.walletAddress) ||
    (typeof body.wallet === "string" && body.wallet);
  if (direct) return direct;

  const nested = body.subject as Record<string, unknown> | undefined;
  if (nested && typeof nested === "object") {
    const w =
      (typeof nested.wallet === "string" && nested.wallet) ||
      (typeof nested.wallet_address === "string" && nested.wallet_address);
    if (w) return w;
  }

  const meta = body.metadata;
  if (meta && typeof meta === "object") {
    const w = findEthAddress(meta);
    if (w) return w;
  }

  const decision = body.decision;
  if (decision && typeof decision === "object") {
    const w = findEthAddress(decision);
    if (w) return w;
  }

  return findEthAddress(body);
}

function workflowMatches(env: Env, body: Record<string, unknown>): boolean {
  if (!env.DIDIT_WORKFLOW_ID) return true;
  const wid = body.workflow_id;
  if (typeof wid !== "string" || !wid.trim()) return false;
  return wid.toLowerCase() === env.DIDIT_WORKFLOW_ID.toLowerCase();
}

function applicationMatches(env: Env, body: Record<string, unknown>): boolean {
  if (!env.DIDIT_APP_ID) return true;
  const app = body.application_id;
  if (app === undefined) return true;
  if (typeof app !== "string") return false;
  return app.toLowerCase() === env.DIDIT_APP_ID.toLowerCase();
}

/**
 * KYC / compliance session approved (see Didit `status` on session webhooks).
 * Transaction webhooks use a different `status` enum (e.g. APPROVED).
 */
function isPositiveDecision(env: Env, body: Record<string, unknown>): boolean {
  const wtype = typeof body.webhook_type === "string" ? body.webhook_type : "";
  if (wtype === "transaction.created" || wtype === "transaction.status.updated") {
    const s = typeof body.status === "string" ? body.status.toUpperCase() : "";
    return s === "APPROVED";
  }
  const st = typeof body.status === "string" ? body.status.toLowerCase() : "";
  if (st === "approved") return true;

  const decision = body.decision;
  if (decision && typeof decision === "object") {
    const ds = (decision as Record<string, unknown>).status;
    if (typeof ds === "string" && ds.toLowerCase() === "approved") return true;
  }
  return false;
}

export function kycRoutes(env: Env) {
  const r = Router();

  r.post("/session", requirePrivyAuth(env), async (req, res, next) => {
    try {
      const privyUser = req.privyUser;
      if (!privyUser) {
        return next(new HttpError(401, "Authentication required", "unauthorized"));
      }

      const walletAccount = privyUser.linked_accounts.find((a) => a.type === "wallet") as any;
      const wallet = walletAccount?.address;
      if (!wallet) {
        return next(new HttpError(400, "Wallet required for KYC", "wallet_required"));
      }

      // Create Didit session
      const diditResponse = await axios.post(
        "https://api.didit.me/v1/session/",
        {
          workflow_id: env.DIDIT_WORKFLOW_ID,
          metadata: {
            wallet_address: wallet,
            privy_id: privyUser.id
          }
        },
        {
          headers: {
            "Authorization": `Token ${env.DIDIT_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      res.json({
        ok: true,
        session_id: diditResponse.data.id,
        url: diditResponse.data.url
      });
    } catch (e) {
      next(e);
    }
  });

  r.post("/didit-webhook", async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const raw = JSON.stringify(body ?? {});
      const payloadHash = createHash("sha256").update(raw).digest("hex");

      if (env.DIDIT_WEBHOOK_SECRET) {
        const signatureV2 = headerString(req, "x-signature-v2");
        const signatureSimple = headerString(req, "x-signature-simple");
        const timestamp = headerString(req, "x-timestamp");
        const ok = verifyDiditWebhookRequest(
          body,
          { signatureV2, signatureSimple, timestamp },
          env.DIDIT_WEBHOOK_SECRET
        );
        if (!ok) {
          return next(new HttpError(401, "Invalid Didit webhook signature", "didit_signature"));
        }
      } else if (env.NODE_ENV === "production") {
        return next(
          new HttpError(503, "DIDIT_WEBHOOK_SECRET is required in production", "didit_misconfigured")
        );
      } else {
        console.warn(
          "[Didit] DIDIT_WEBHOOK_SECRET is not set — accepting unsigned webhooks (development only). Do not use in production."
        );
      }

      if (!applicationMatches(env, body)) {
        return res.json({ ok: true, skipped: true, reason: "application_id_mismatch" });
      }

      if (!workflowMatches(env, body)) {
        return res.json({ ok: true, skipped: true, reason: "workflow_id_mismatch" });
      }

      const externalId =
        (typeof body.event_id === "string" && body.event_id) ||
        (typeof body.session_id === "string" && body.session_id) ||
        (typeof body.id === "string" && body.id) ||
        payloadHash.slice(0, 32);

      const existing = await prisma.kycWebhookEvent.findUnique({
        where: { externalId },
      });
      if (existing) {
        return res.json({ ok: true, duplicate: true });
      }

      await prisma.kycWebhookEvent.create({
        data: { externalId, payloadHash, processed: false },
      });

      if (!isPositiveDecision(env, body)) {
        await prisma.kycWebhookEvent.update({
          where: { externalId },
          data: { processed: true },
        });
        return res.json({ ok: true, processed: false, reason: "not_approved" });
      }

      let rawWallet = pickWalletFromRecord(body);
      if (!rawWallet && typeof body.session_id === "string" && env.DIDIT_API_KEY) {
        const decision = await fetchDiditSessionDecision(env, body.session_id);
        if (decision) {
          rawWallet = pickWalletFromRecord(decision);
        }
      }

      if (!rawWallet) {
        await prisma.kycWebhookEvent.update({
          where: { externalId },
          data: { processed: true },
        });
        return res.status(202).json({ ok: true, warning: "no_wallet_in_payload" });
      }

      let wallet: string;
      try {
        wallet = ethers.getAddress(rawWallet);
      } catch {
        await prisma.kycWebhookEvent.update({
          where: { externalId },
          data: { processed: true },
        });
        return res.status(202).json({ ok: true, warning: "invalid_wallet" });
      }

      const user = await prisma.user.findFirst({
        where: { walletAddress: { equals: wallet, mode: "insensitive" } },
      });

      await prisma.user.updateMany({
        where: { walletAddress: { equals: wallet, mode: "insensitive" } },
        data: { kycStatus: "APPROVED" },
      });

      let whitelistResults: Awaited<ReturnType<typeof whitelistWalletOnAllTokens>> | null = null;
      try {
        whitelistResults = await whitelistWalletOnAllTokens(env, wallet, user?.id ?? null);
      } catch (e) {
        console.error("whitelistWalletOnAllTokens failed:", e);
      }

      await prisma.kycWebhookEvent.update({
        where: { externalId },
        data: { processed: true },
      });

      res.json({ ok: true, processed: true, whitelistResults });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
