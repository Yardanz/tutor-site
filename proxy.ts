import { NextRequest, NextResponse } from "next/server";
import { verifyAdminJwt } from "@/lib/auth";

function isPublicAdminPath(pathname: string) {
  return pathname === "/admin/login" || pathname === "/api/admin/login";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicAdminPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    if (pathname.startsWith("/api/admin/")) {
      return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
    }

    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await verifyAdminJwt(token);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/admin/")) {
      return NextResponse.json({ error: "Сессия истекла." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
