import { HttpError } from "../lib/errors";

const RENTCAST_BASE_URL = "https://api.rentcast.io/v1/avm/value";

export type PropertyValuationPayload = {
  estimatedValueUSD: number;
};

export async function getPropertyValuationById(
  propertyId: string,
  rentcastApiKey: string | undefined
): Promise<PropertyValuationPayload> {
  if (!rentcastApiKey) {
    throw new HttpError(503, "Property oracle is not configured (RENTCAST_API_KEY)", "oracle_unconfigured");
  }

  const addressQuery = propertyId.replace(/-/g, " ");
  const url = `${RENTCAST_BASE_URL}?address=${encodeURIComponent(addressQuery)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "X-Api-Key": rentcastApiKey,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new HttpError(
      502,
      `RentCast error (${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`,
      "rentcast_error"
    );
  }

  const property = (await response.json()) as { price?: unknown };
  const estimatedValueUSD = property.price;

  if (typeof estimatedValueUSD !== "number" || estimatedValueUSD <= 0) {
    throw new HttpError(502, `Invalid RentCast valuation: ${String(estimatedValueUSD)}`, "rentcast_invalid");
  }

  return { estimatedValueUSD };
}
