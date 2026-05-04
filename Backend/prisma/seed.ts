/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.asset.upsert({
    where: {
      kind_externalId: { kind: "carbon", externalId: "VCS-191-AMAZON-REDD" },
    },
    create: {
      kind: "carbon",
      externalId: "VCS-191-AMAZON-REDD",
      status: "ACTIVE",
      quantity: 5000,
    },
    update: {
      status: "ACTIVE",
      quantity: 5000,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
