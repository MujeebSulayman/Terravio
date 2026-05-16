import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. LBMA Gold
  await prisma.asset.upsert({
    where: { kind_externalId: { kind: "gold", externalId: "lbma-gold-001" } },
    create: {
      kind: "gold",
      externalId: "lbma-gold-001",
      address: "0xB5b3470F502DBFa709bCd4ad0C2a250ff8D49986",
      name: "LBMA Physical Gold",
      symbol: "TGLD",
      status: "ACTIVE",
      quantity: 100,
      apy: 4.2,
      assetType: "Precious Metal",
      metadata: {
        description: "London Bullion Market Association certified gold bars held in Brinks vaults.",
        location: "Brinks, London, UK",
      },
    },
    update: {
      address: "0xB5b3470F502DBFa709bCd4ad0C2a250ff8D49986",
      status: "ACTIVE",
    },
  });

  // 2. Residential Property
  await prisma.asset.upsert({
    where: { kind_externalId: { kind: "property", externalId: "pcl-residential-pool-001" } },
    create: {
      kind: "property",
      externalId: "pcl-residential-pool-001",
      address: "0x2Fd4B60Cad1d75438C34F3ED134BE3480fda931B",
      name: "Residential Yield Pool",
      symbol: "TPROP",
      status: "ACTIVE",
      quantity: 1,
      apy: 8.4,
      assetType: "Real Estate",
      metadata: {
        description: "Fractional ownership in a curated portfolio of prime central London residential properties.",
        location: "Prime Central London, UK",
      },
    },
    update: {
      address: "0x2Fd4B60Cad1d75438C34F3ED134BE3480fda931B",
      status: "ACTIVE",
    },
  });

  // 3. Carbon Credits
  await prisma.asset.upsert({
    where: { kind_externalId: { kind: "carbon", externalId: "verra-carbon-001" } },
    create: {
      kind: "carbon",
      externalId: "verra-carbon-001",
      address: "0x0777694b6999F01eA277A430Ad10d224005F7C19",
      name: "Global Carbon Removals",
      symbol: "TCARB",
      status: "ACTIVE",
      quantity: 10000,
      apy: 6.1,
      assetType: "Environmental Credit",
      metadata: {
        description: "Verified carbon removal credits from forestry, BECCS, and direct air capture projects.",
        location: "Global (Verra Registry)",
      },
    },
    update: {
      address: "0x0777694b6999F01eA277A430Ad10d224005F7C19",
      status: "ACTIVE",
    },
  });

  // 4. Test Carbon Credit (used by test script)
  await prisma.asset.upsert({
    where: { kind_externalId: { kind: "carbon", externalId: "VCS-191-AMAZON-REDD" } },
    create: {
      kind: "carbon",
      externalId: "VCS-191-AMAZON-REDD",
      status: "ACTIVE",
      quantity: 5000,
      metadata: { project: "Amazon REDD+" }
    },
    update: {
      status: "ACTIVE",
      quantity: 5000,
    },
  });

  console.log("✅ Database seeded with real RWA assets.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
