import { NextResponse } from "next/server";
import { getAdminSessionCookieName } from "@/lib/auth/adminSession";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookieName = getAdminSessionCookieName();
  response.cookies.set(cookieName, "", {
    maxAge: 0,
    path: "/",
  });
  return response;
}

