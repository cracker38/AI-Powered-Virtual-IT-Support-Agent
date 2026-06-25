const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log("Seeding database...");

  // 1. Create a default admin/technician user
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const user = await prisma.user.upsert({
    where: { email: "tech@cypadi.com" },
    update: {},
    create: {
      email: "tech@cypadi.com",
      name: "John Technician",
      password: hashedPassword,
      role: "TECHNICIAN",
      securityQuestion: "What was the name of your first pet?",
      securityAnswer: "Fluffy",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@cypadi.com" },
    update: {},
    create: {
      email: "admin@cypadi.com",
      name: "System Administrator",
      password: hashedPassword,
      role: "ADMIN",
      securityQuestion: "What was the name of your first pet?",
      securityAnswer: "Fluffy",
    },
  });

  console.log(`Users created: ${user.email}, ${admin.email}`);

  // Create an anonymous guest user for unauthenticated chats
  await prisma.user.upsert({
    where: { id: "anonymous" },
    update: {},
    create: {
      id: "anonymous",
      email: "guest@example.com",
      name: "Guest User",
      password: hashedPassword, // Dummy password
      role: "USER",
      securityQuestion: "What was the name of your first pet?",
      securityAnswer: "Fluffy",
    }
  });
  console.log("Anonymous guest user created.");
  const technician = await prisma.technician.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      expertise: "Network,Hardware,Software,Passwords",
      status: "AVAILABLE",
      currentWorkload: 0,
    },
  });

  console.log(`Technician profile created for: ${user.name}`);

  // 3. Create Ticket Categories
  const categories = [
    { name: "Network", description: "WiFi, VPN, and Internet issues", relatedExpertise: "Network" },
    { name: "Hardware", description: "Laptop, Printer, and Peripheral issues", relatedExpertise: "Hardware" },
    { name: "Software", description: "Application crashes and installation", relatedExpertise: "Software" },
    { name: "Security", description: "Password resets and account locks", relatedExpertise: "Passwords" },
  ];

  for (const cat of categories) {
    await prisma.ticketCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log("Categories created.");

  // 4. Create some Knowledge Articles
  const articles = [
    { title: "How to Reset Your password", content: "Go to settings > security > change password. If locked, contact IT.", category: "Security" },
    { title: "VPN Connection Guide", content: "Use GlobalProtect with your corporate credentials and MFA.", category: "Network" },
  ];

  for (const art of articles) {
    const existing = await prisma.knowledgeArticle.findFirst({ where: { title: art.title } });
    if (!existing) {
      await prisma.knowledgeArticle.create({ data: art });
    }
  }

  console.log("Knowledge articles created.");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
