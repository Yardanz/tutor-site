import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { requireAdmin } from "@/lib/api";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearAuthCookie());
  return response;
}
