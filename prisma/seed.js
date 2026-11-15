import { prisma } from "../src/config/prisma.js";

async function main() {
  await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: { name: "USER" }
  });

  await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" }
  });

  console.log("Початкові ролі створено");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });