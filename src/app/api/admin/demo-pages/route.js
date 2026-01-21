import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { DemoPage } from "@/lib/models/DemoPage";
import bcrypt from "bcryptjs";
import { normalizeSlug } from "@/lib/slug";
// Ensure referenced models are registered for populate() in this route bundle
import "@/lib/models/BolchoToken";
import "@/lib/models/Assistant";
import "@/lib/models/PhoneNumber";

export async function GET() {
  try {
    await dbConnect();
    const demoPages = await DemoPage.find()
      .populate("bolchoTokenId", "name")
      .populate("assistantId", "name assistantId")
      .populate("phoneNumberId", "name phoneNumberId")
      .sort({ createdAt: -1 });
    return NextResponse.json(demoPages);
  } catch (error) {
    console.error("Error fetching demo pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo pages" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      slug,
      title,
      bolchoTokenId,
      assistantId,
      phoneNumberId,
      fields,
      callToFieldKey,
      variables,
      passwordRequired,
      password,
      maxCalls,
      isActive,
    } = body;

    const normalizedSlug = normalizeSlug(slug);

    if (!normalizedSlug || !bolchoTokenId || !assistantId || !phoneNumberId || !callToFieldKey) {
      return NextResponse.json(
        {
          error:
            "slug, bolchoTokenId, assistantId, phoneNumberId, and callToFieldKey are required",
        },
        { status: 400 },
      );
    }

    let passwordHash = null;
    if (passwordRequired && password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const cleanedVariables = Array.isArray(variables)
      ? variables
          .filter((v) => v && v.key && v.value)
          .map((v) => ({
            key: String(v.key).trim(),
            source: v.source === "field" ? "field" : "static",
            value: String(v.value).trim(),
          }))
      : [];

    const demoPage = await DemoPage.create({
      slug: normalizedSlug,
      title,
      bolchoTokenId,
      assistantId,
      phoneNumberId,
      fields: fields || [],
      callToFieldKey,
      variables: cleanedVariables,
      passwordRequired: passwordRequired || false,
      passwordHash,
      maxCalls: maxCalls || null,
      isActive: isActive !== undefined ? !!isActive : true,
    });

    const populated = await DemoPage.findById(demoPage._id)
      .populate("bolchoTokenId", "name")
      .populate("assistantId", "name assistantId")
      .populate("phoneNumberId", "name phoneNumberId");

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Demo page with this slug already exists" },
        { status: 409 },
      );
    }
    console.error("Error creating demo page:", error);
    return NextResponse.json(
      { error: "Failed to create demo page", details: error.message },
      { status: 500 },
    );
  }
}

