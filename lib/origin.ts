import { NextRequest } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function assertSameOrigin(request: NextRequest) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;

  const origin = request.headers.get("origin");
  if (!origin) return;

  const host = request.headers.get("host");
  if (!host) throw new Error("Missing host header.");

  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const expectedOrigin = `${proto}://${host}`;
  if (origin !== expectedOrigin) {
    throw new Error("Origin mismatch.");
  }
}
