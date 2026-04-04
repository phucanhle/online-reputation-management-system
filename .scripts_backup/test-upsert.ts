import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.cinema.upsert({
      where: { placeId: "ChIJvwIcfsAndTERWkoNLFY7bgM" },
      update: { name: "Lotte Cinema Moonlight" },
      create: { placeId: "ChIJvwIcfsAndTERWkoNLFY7bgM", name: "Lotte Cinema Moonlight" }
    });
    console.log("Upsert succeeded!");
  } catch(e: any) {
    console.error("Upsert failed:");
    console.error(e.message);
  }
}
main();
