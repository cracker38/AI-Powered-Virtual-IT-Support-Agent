const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  try {
    const users = await prisma.user.findMany();
    console.log(`Users: ${users.length}`);
    if (users.length > 0) {
      console.log(`Sample User ID: ${users[0].id}`);
    }

    const technicians = await prisma.technician.findMany({
      include: { user: true }
    });
    console.log(`Technicians: ${technicians.length}`);
    technicians.forEach(t => {
      console.log(`- ${t.user.name} (Expertise: ${t.expertise}, Status: ${t.status})`);
    });

    const categories = await prisma.ticketCategory.findMany();
    console.log(`Categories: ${categories.length}`);

  } catch (err) {
    console.error("DB Check Failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
