import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  signAdminSession,
  verifyAdminSession,
} from "@/lib/admin-session-token";

export type CurrentAdmin = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN";
};

export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifyAdminSession(token);
  if (!session) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      sessionVersion: true,
    },
  });

  if (
    !admin ||
    !admin.isActive ||
    admin.role !== "ADMIN" ||
    admin.sessionVersion !== session.sessionVersion
  ) {
    return null;
  }

  return { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" };
});

export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function createAdminSession(admin: {
  id: string;
  role: "ADMIN";
  sessionVersion: number;
}) {
  const token = await signAdminSession({
    userId: admin.id,
    role: admin.role,
    sessionVersion: admin.sessionVersion,
  });

  (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
    priority: "high",
  });
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}
