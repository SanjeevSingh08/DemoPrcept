import { NextResponse } from "next/server";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "./lib/auth/adminSession";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const isAdminPage =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/");

  const isAdminLogin =
    pathname === "/admin/login" || pathname === "/api/admin/login";

  if (!isAdminPage || isAdminLogin) return NextResponse.next();

  const cookieName = getAdminSessionCookieName();
  const token = request.cookies.get(cookieName)?.value;

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  try {
    await verifyAdminSession(token);
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/admin/login", request.url));
    res.cookies.set(cookieName, "", { maxAge: 0, path: "/" });
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

