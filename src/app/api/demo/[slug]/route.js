import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { DemoPage } from "@/lib/models/DemoPage";
import { verifyDemoSession } from "@/lib/auth/demoSession";
import { normalizeSlug } from "@/lib/slug";
// Ensure referenced models are registered for populate() in this route bundle
import "@/lib/models/BolchoToken";
import "@/lib/models/Assistant";
import "@/lib/models/PhoneNumber";

export async function GET(request, context) {
  try {
    await dbConnect();
    // Next.js 16+ may provide params asynchronously
    const params = await Promise.resolve(context.params);
    const slug = normalizeSlug(params?.slug);
    const demoPage = await DemoPage.findOne({ slug, isActive: true })
      .populate("bolchoTokenId", "name")
      .populate("assistantId", "name assistantId")
      .populate("phoneNumberId", "name phoneNumberId phoneNumber");

    if (!demoPage) {
      return NextResponse.json({ error: "Demo page not found" }, { status: 404 });
    }

    // Check password protection
    if (demoPage.passwordRequired) {
      const cookieName = `demo_${slug}`;
      const token = request.cookies.get(cookieName)?.value;

      if (!token) {
        return NextResponse.json(
          { error: "Password required", passwordRequired: true },
          { status: 401 },
        );
      }

      try {
        await verifyDemoSession(token, slug);
      } catch {
        return NextResponse.json(
          { error: "Password required", passwordRequired: true },
          { status: 401 },
        );
      }
    }

    // Don't send sensitive data
    const safePage = {
      _id: demoPage._id,
      slug: demoPage.slug,
      title: demoPage.title,
      fields: demoPage.fields,
      passwordRequired: demoPage.passwordRequired,
      maxCalls: demoPage.maxCalls,
      callsMade: demoPage.callsMade,
    };

    return NextResponse.json(safePage);
  } catch (error) {
    console.error("Error fetching demo page:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo page" },
      { status: 500 },
    );
  }
}

