import { prisma } from "../lib/prisma";

export type CarbonStatusPayload = {
  status: string;
  quantity: number;
};

export async function getCarbonStatusByExternalId(
  externalId: string
): Promise<CarbonStatusPayload | null> {
  const row = await prisma.asset.findUnique({
    where: { kind_externalId: { kind: "carbon", externalId } },
  });
  if (!row) return null;
  return {
    status: row.status,
    quantity: row.quantity ?? 0,
  };
}
