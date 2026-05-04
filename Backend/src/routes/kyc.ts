import { createHash, timingSafeEqual } from "node:crypto";
import { ethers } from "ethers";
import { Router } from "express";
import type { Env } from "../config/env";
import { HttpError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { whitelistWalletOnAllTokens } from "../services/whitelistService";

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function pickWallet(body: Record<string, unknown>): string | null {
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
  return null;
}

function isApprovalPayload(body: Record<string, unknown>): boolean {
  const status =
    (typeof body.status === "string" && body.status.toLowerCase()) ||
    (typeof body.verification_status === "string" && body.verification_status.toLowerCase()) ||
    (typeof body.decision === "string" && body.decision.toLowerCase());
  if (status && ["approved", "success", "verified", "complete"].includes(status)) {
    return true;
  }
  const approvedFlag = body.approved;
  return approvedFlag === true;
}

export function kycRoutes(env: Env) {
  const r = Router();

  r.post("/didit-webhook", async (req, res, next) => {
    try {
      if (env.DIDIT_WEBHOOK_SECRET) {
        const provided = req.headers["x-webhook-secret"];
        const secret =
          typeof provided === "string" ? provided : Array.isArray(provided) ? provided[0] : "";
        if (!secret || !safeEqual(secret, env.DIDIT_WEBHOOK_SECRET)) {
          return next(new HttpError(401, "Invalid webhook secret", "webhook_auth"));
        }
      }

      const body = req.body as Record<string, unknown>;
      const raw = JSON.stringify(body ?? {});
      const payloadHash = createHash("sha256").update(raw).digest("hex");
      const externalId =
        (typeof body.id === "string" && body.id) ||
        (typeof body.event_id === "string" && body.event_id) ||
        (typeof body.eventId === "string" && body.eventId) ||
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

      if (!isApprovalPayload(body)) {
        await prisma.kycWebhookEvent.update({
          where: { externalId },
          data: { processed: true },
        });
        return res.json({ ok: true, processed: false, reason: "not_approval" });
      }

      const rawWallet = pickWallet(body);
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
