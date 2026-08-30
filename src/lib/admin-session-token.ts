import { jwtVerify, SignJWT } from "jose";

export const ADMIN_SESSION_COOKIE = "glarivo_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export type AdminSessionPayload = {
  userId: string;
  role: "ADMIN";
  sessionVersion: number;
};

function signingKey() {
  const secret = process.env.SESSION_SECRET?.trim();

  if (!secret || secret === "CHANGE_ME" || new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 bytes.");
  }

  return new TextEncoder().encode(secret);
}

export async function signAdminSession(payload: AdminSessionPayload) {
  return new SignJWT({
    role: payload.role,
    sessionVersion: payload.sessionVersion,
    type: "admin-session",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuer("glarivo")
    .setAudience("glarivo-admin")
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE_SECONDS}s`)
    .sign(signingKey());
}

export async function verifyAdminSession(token: string | undefined): Promise<AdminSessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      algorithms: ["HS256"],
      issuer: "glarivo",
      audience: "glarivo-admin",
      clockTolerance: 5,
    });

    if (
      payload.type !== "admin-session" ||
      payload.role !== "ADMIN" ||
      typeof payload.sub !== "string" ||
      typeof payload.sessionVersion !== "number" ||
      !Number.isInteger(payload.sessionVersion)
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      role: "ADMIN",
      sessionVersion: payload.sessionVersion,
    };
  } catch {
    return null;
  }
}
