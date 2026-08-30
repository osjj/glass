"use server";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearAdminSession, createAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const loginSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required").max(200),
  next: z.string().optional(),
});

export type AdminLoginState = {
  error?: string;
  errors?: Record<string, string[]>;
};

function safeAdminDestination(value: string | undefined) {
  if (!value || !value.startsWith("/admin") || value.startsWith("//") || value.startsWith("/admin/login")) {
    return "/admin";
  }
  return value;
}

export async function loginAdmin(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  const admin = await prisma.adminUser.findUnique({ where: { email: result.data.email } });
  const now = new Date();

  if (admin?.lockedUntil && admin.lockedUntil > now) {
    return { error: `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.` };
  }

  const passwordMatches = admin
    ? await compare(result.data.password, admin.passwordHash)
    : (await hash(result.data.password, 12), false);

  if (!admin || !admin.isActive || admin.role !== "ADMIN" || !passwordMatches) {
    if (admin) {
      const attempts = admin.failedLoginAttempts + 1;
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil:
            attempts >= MAX_FAILED_ATTEMPTS
              ? new Date(now.getTime() + LOCK_MINUTES * 60 * 1000)
              : null,
        },
      });
    }

    return { error: "Email or password is incorrect." };
  }

  const authenticatedAdmin = await prisma.adminUser.update({
    where: { id: admin.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: now },
    select: { id: true, role: true, sessionVersion: true },
  });

  await createAdminSession(authenticatedAdmin);
  redirect(safeAdminDestination(result.data.next));
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}
