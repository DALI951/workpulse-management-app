import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("admin123", salt);

    await prisma.user.create({
      data: {
        username: "System Admin",
        email: "admin@example.com",
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log("Created default admin: admin@example.com / admin123");
  } else {
    console.log("Admin account already exists:", existingAdmin.email);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
