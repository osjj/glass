import "dotenv/config";

import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "../src/lib/prisma";

const adminSchema = z.object({
  email: z.email("ADMIN_EMAIL must be a valid email address").trim().toLowerCase(),
  name: z.string().trim().min(2).max(80).optional(),
  password: z
    .string()
    .min(12, "ADMIN_PASSWORD must contain at least 12 characters")
    .max(200)
    .regex(/[a-z]/, "ADMIN_PASSWORD must contain a lowercase letter")
    .regex(/[A-Z]/, "ADMIN_PASSWORD must contain an uppercase letter")
    .regex(/[0-9]/, "ADMIN_PASSWORD must contain a number")
    .regex(/[^A-Za-z0-9]/, "ADMIN_PASSWORD must contain a special character"),
});

async function main() {
  const parsed = adminSchema.safeParse({
    email: process.env.ADMIN_EMAIL,
    name: process.env.ADMIN_NAME?.trim() || undefined,
    password: process.env.ADMIN_PASSWORD,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("\n"));
  }

  const passwordHash = await hash(parsed.data.password, 12);
  const existing = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });

  if (existing) {
    await prisma.adminUser.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name ?? existing.name,
        passwordHash,
        role: "ADMIN",
        isActive: true,
        sessionVersion: { increment: 1 },
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    console.log(`Administrator updated: ${parsed.data.email}`);
    return;
  }

  await prisma.adminUser.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`Administrator created: ${parsed.data.email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Unable to create administrator");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
