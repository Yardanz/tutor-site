import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/origin";
import { getCurrentAdminFromRequest } from "@/lib/auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAdmin(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch {
    return { error: jsonError("Недопустимый источник запроса.", 403) };
  }

  const admin = await getCurrentAdminFromRequest(request);
  if (!admin) {
    return { error: jsonError("Требуется авторизация.", 401) };
  }

  return { admin };
}
