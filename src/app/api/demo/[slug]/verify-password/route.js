import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { DemoPage } from "@/lib/models/DemoPage";
import bcrypt from "bcryptjs";
import { signDemoSession } from "@/lib/auth/demoSession";
import { normalizeSlug } from "@/lib/slug";

export async function POST(request, context) {
  try {
    await dbConnect();
    const { password } = await request.json();

    const params = await Promise.resolve(context.params);
    const slug = normalizeSlug(params?.slug);
    const demoPage = await DemoPage.findOne({ slug, isActive: true });

    if (!demoPage) {
      return NextResponse.json({ error: "Demo page not found" }, { status: 404 });
    }

    if (!demoPage.passwordRequired) {
      return NextResponse.json({ error: "Password not required" }, { status: 400 });
    }

    if (!demoPage.passwordHash) {
      return NextResponse.json({ error: "Password not configured" }, { status: 500 });
    }

    const isValid = await bcrypt.compare(password, demoPage.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Create session token
    const token = await signDemoSession({ slug });

    const response = NextResponse.json({ success: true });
    const cookieName = `demo_${slug}`;
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/", // Set to root so it's available for both /d/[slug] and /api/demo/[slug]
    });

    return response;
  } catch (error) {
    console.error("Error verifying password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

