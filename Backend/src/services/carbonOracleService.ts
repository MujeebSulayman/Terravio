import { prisma } from "../lib/prisma";

export type CarbonStatusPayload = {
  status: string;
  quantity: number;
};

export async function getCarbonStatusByExternalId(
  externalId: string
): Promise<CarbonStatusPayload | null> {
  console.log(`[carbonOracleService] Fetching status for ${externalId}...`);
  const row = await prisma.asset.findUnique({
    where: { kind_externalId: { kind: "carbon", externalId } },
  });
  console.log(`[carbonOracleService] DB Result:`, row ? "Found" : "Not Found");
  if (!row) return null;
  return {
    status: row.status,
    quantity: row.quantity ?? 0,
  };
}
