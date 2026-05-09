import { createHash, createHmac, timingSafeEqual } from "node:crypto";
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
    (typeof body.vendor_data === "string" && body.vendor_data) ||
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
    return s === "APPROVED" || s === "COMPLETED" || s === "SUCCESS";
  }
  
  const st = typeof body.status === "string" ? body.status.toLowerCase() : "";
  const positiveStates = ["approved", "completed", "success", "verified", "verified_identity", "active"];
  if (positiveStates.includes(st)) return true;

  const decision = body.decision;
  if (decision && typeof decision === "object") {
    const ds = (decision as Record<string, unknown>).status;
    if (typeof ds === "string" && positiveStates.includes(ds.toLowerCase())) return true;
  }
  return false;
}

export function kycRoutes(env: Env) {
  const r = Router();

  r.post("/api/kyc/session", requirePrivyAuth(env), async (req, res, next) => {
    try {
      const privyUser = req.privyUser;
      if (!privyUser) {
        return next(new HttpError(401, "Authentication required", "unauthorized"));
      }

      const { upsertUserFromPrivy } = require("../services/userService");
      const user = await upsertUserFromPrivy(privyUser);

      const walletAccount = privyUser.linked_accounts.find((a) => a.type === "wallet") as any;
      const wallet = walletAccount?.address;
      if (!wallet) {
        return next(new HttpError(400, "Wallet required for KYC", "wallet_required"));
      }

      // Create Didit session
      let diditResponse;
      try {
        const frontendUrl = req.headers.origin || env.FRONTEND_URL;
        const backendUrl = env.TERRAVIO_BACKEND_BASE_URL || "https://terravio.onrender.com";
        diditResponse = await axios.post(
          "https://verification.didit.me/v3/session/",
          {
            workflow_id: env.DIDIT_WORKFLOW_ID,
            vendor_data: wallet,
            callback: `${backendUrl}/api/webhooks/didit`,
            redirect_url: `${frontendUrl}/dashboard`
          },
          {
            headers: {
              "x-api-key": env.DIDIT_API_KEY,
              "Content-Type": "application/json"
            }
          }
        );
      } catch (error: any) {
        console.error("Didit API Error:", error.response?.data || error.message);
        return next(new HttpError(
          error.response?.status || 500,
          `Didit Session Error: ${JSON.stringify(error.response?.data || error.message)}`,
          "didit_error"
        ));
      }

      res.json({
        ok: true,
        session_id: diditResponse.data.id,
        url: diditResponse.data.url
      });

      // Update user with session ID and reset status to PENDING to ensure fresh check
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          kycSessionId: diditResponse.data.id,
          kycStatus: "PENDING"
        } as any
      });
    } catch (e) {
      console.error("Internal KYC Route Error:", e);
      next(e);
    }
  });

  r.post("/api/webhooks/didit", async (req: any, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      
      if (env.DIDIT_WEBHOOK_SECRET) {
        const signatureV2 = req.headers["x-signature-v2"];
        const rawBody = req.rawBody;

        if (!signatureV2 || !rawBody) {
          console.error("[Didit Webhook] Missing signature or raw body");
          return next(new HttpError(401, "Invalid Didit webhook request", "didit_invalid_request"));
        }

        const hmac = createHmac("sha256", env.DIDIT_WEBHOOK_SECRET);
        hmac.update(rawBody);
        const calculatedSignature = hmac.digest("hex");

        // Use constant-time comparison
        const isVerified = timingSafeEqual(
          Buffer.from(signatureV2, "hex"),
          Buffer.from(calculatedSignature, "hex")
        );

        if (!isVerified) {
          console.error("[Didit Webhook] Signature mismatch");
          return next(new HttpError(401, "Invalid Didit webhook signature", "didit_signature"));
        }
      } else if (env.NODE_ENV === "production") {
        return next(
          new HttpError(503, "DIDIT_WEBHOOK_SECRET is required in production", "didit_misconfigured")
        );
      } else {
        console.warn("[Didit] Accepting unsigned webhook (dev only)");
      }

      if (!applicationMatches(env, body)) {
        return res.json({ ok: true, skipped: true, reason: "application_id_mismatch" });
      }

      if (!workflowMatches(env, body)) {
        return res.json({ ok: true, skipped: true, reason: "workflow_id_mismatch" });
      }

      const payloadHash = createHash("sha256").update(req.rawBody || JSON.stringify(body)).digest("hex");

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

  r.get("/refresh", requirePrivyAuth(env), async (req, res, next) => {
    try {
      const privyId = req.privyUserId;
      const user = (await prisma.user.findUnique({ where: { privyId } })) as any;

      if (!user || !user.kycSessionId) {
        return res.json({ ok: true, status: user?.kycStatus || "UNVERIFIED" });
      }

      // Fetch latest from Didit
      try {
        const diditRes = await axios.get(
          `https://verification.didit.me/v3/session/${user.kycSessionId}/`,
          {
            headers: { "x-api-key": env.DIDIT_API_KEY }
          }
        );

        const data = diditRes.data;
        console.log("Didit Refresh Data:", data);

        if (isPositiveDecision(env, data)) {
          await prisma.user.update({
            where: { id: user.id },
            data: { kycStatus: "APPROVED" }
          });
          
          // Trigger whitelisting if wallet exists
          if (user.walletAddress) {
            const { whitelistWalletOnAllTokens } = require("../services/kycService");
            whitelistWalletOnAllTokens(env, user.walletAddress).catch(console.error);
          }

          return res.json({ ok: true, status: "APPROVED" });
        } else if (data.status === "REJECTED" || data.decision?.status === "REJECTED") {
          await prisma.user.update({
            where: { id: user.id },
            data: { kycStatus: "REJECTED" }
          });
          return res.json({ ok: true, status: "REJECTED" });
        }

        return res.json({ ok: true, status: user.kycStatus });
      } catch (error: any) {
        console.error("Didit Refresh Error:", error.response?.data || error.message);
        return res.json({ ok: false, error: "Failed to fetch from Didit" });
      }
    } catch (e) {
      next(e);
    }
  });

  return r;
}
