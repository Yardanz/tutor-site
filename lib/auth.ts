import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { env } from "@/lib/env";

const COOKIE_NAME = "admin_token";

function getSecret() {
  return new TextEncoder().encode(env.jwtSecret);
}

export async function signAdminJwt(adminId: number, email: string) {
  return new SignJWT({ adminId, email, role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAdminJwt(token: string) {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
  });

  return payload as { adminId: number; email: string; role: "owner" };
}

export function buildAuthCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function clearAuthCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 0,
  };
}

export async function getCurrentAdminFromRequest(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return await verifyAdminJwt(token);
  } catch {
    return null;
  }
}

export async function getCurrentAdminFromCookies() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return await verifyAdminJwt(token);
  } catch {
    return null;
  }
}
