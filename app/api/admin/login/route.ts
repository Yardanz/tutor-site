import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAuthCookie, signAdminJwt } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/origin";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);

    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Введите email и пароль." }, { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin) {
      return NextResponse.json({ error: "Неверный email или пароль." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Неверный email или пароль." }, { status: 401 });
    }

    const token = await signAdminJwt(admin.id, admin.email);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(buildAuthCookie(token));
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ошибка входа." }, { status: 500 });
  }
}
