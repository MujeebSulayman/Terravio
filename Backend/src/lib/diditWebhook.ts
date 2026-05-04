import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Didit webhook signature verification.
 * @see https://docs.didit.me/integration/webhooks
 */

function shortenFloats(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(shortenFloats);
  }
  if (data !== null && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([key, value]) => [key, shortenFloats(value)])
    );
  }
  if (typeof data === "number" && !Number.isInteger(data) && data % 1 === 0) {
    return Math.trunc(data);
  }
  return data;
}

function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortKeys((obj as Record<string, unknown>)[key]);
        return result;
      }, {});
  }
  return obj;
}

function hexEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * X-Signature-V2 (recommended): HMAC-SHA256(secret, canonicalJson) with sorted keys + float normalization.
 */
export function verifyDiditSignatureV2(
  jsonBody: unknown,
  signatureHeader: string,
  timestampHeader: string,
  secretKey: string
): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  const incomingTime = parseInt(timestampHeader, 10);
  if (Number.isNaN(incomingTime) || Math.abs(currentTime - incomingTime) > 300) {
    return false;
  }
  const processedData = shortenFloats(jsonBody);
  const canonicalJson = JSON.stringify(sortKeys(processedData));
  const expected = createHmac("sha256", secretKey).update(canonicalJson, "utf8").digest("hex");
  return hexEquals(expected, signatureHeader);
}

/**
 * X-Signature-Simple (fallback).
 */
export function verifyDiditSignatureSimple(
  jsonBody: Record<string, unknown>,
  signatureHeader: string,
  timestampHeader: string,
  secretKey: string
): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  const incomingTime = parseInt(timestampHeader, 10);
  if (Number.isNaN(incomingTime) || Math.abs(currentTime - incomingTime) > 300) {
    return false;
  }
  const canonicalString = [
    String(jsonBody.timestamp ?? ""),
    String(jsonBody.session_id ?? ""),
    String(jsonBody.status ?? ""),
    String(jsonBody.webhook_type ?? ""),
  ].join(":");
  const expected = createHmac("sha256", secretKey).update(canonicalString).digest("hex");
  return hexEquals(expected, signatureHeader);
}

export function verifyDiditWebhookRequest(
  jsonBody: unknown,
  headers: {
    signatureV2: string | undefined;
    signatureSimple: string | undefined;
    timestamp: string | undefined;
  },
  secretKey: string
): boolean {
  if (!headers.timestamp) return false;
  if (typeof jsonBody === "object" && jsonBody !== null && !Array.isArray(jsonBody)) {
    const o = jsonBody as Record<string, unknown>;
    if (headers.signatureV2 && verifyDiditSignatureV2(jsonBody, headers.signatureV2, headers.timestamp, secretKey)) {
      return true;
    }
    if (headers.signatureSimple) {
      return verifyDiditSignatureSimple(o, headers.signatureSimple, headers.timestamp, secretKey);
    }
  }
  return false;
}
