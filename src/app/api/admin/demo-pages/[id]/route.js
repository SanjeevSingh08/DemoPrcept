import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { DemoPage } from "@/lib/models/DemoPage";
import bcrypt from "bcryptjs";
import { normalizeSlug } from "@/lib/slug";
// Ensure referenced models are registered for populate() in this route bundle
import "@/lib/models/BolchoToken";
import "@/lib/models/Assistant";
import "@/lib/models/PhoneNumber";

export async function GET(request, context) {
  try {
    await dbConnect();
    const params = await Promise.resolve(context.params);
    const demoPage = await DemoPage.findById(params?.id)
      .populate("bolchoTokenId", "name")
      .populate("assistantId", "name assistantId")
      .populate("phoneNumberId", "name phoneNumberId");

    if (!demoPage) {
      return NextResponse.json({ error: "Demo page not found" }, { status: 404 });
    }
    return NextResponse.json(demoPage);
  } catch (error) {
    console.error("Error fetching demo page:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo page" },
      { status: 500 },
    );
  }
}

export async function PUT(request, context) {
  try {
    await dbConnect();
    const params = await Promise.resolve(context.params);
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

    const updateData = {};
    if (slug !== undefined) updateData.slug = normalizeSlug(slug);
    if (title !== undefined) updateData.title = title;
    if (bolchoTokenId !== undefined) updateData.bolchoTokenId = bolchoTokenId;
    if (assistantId !== undefined) updateData.assistantId = assistantId;
    if (phoneNumberId !== undefined) updateData.phoneNumberId = phoneNumberId;
    if (fields !== undefined) updateData.fields = fields;
    if (callToFieldKey !== undefined) updateData.callToFieldKey = callToFieldKey;
    if (maxCalls !== undefined) updateData.maxCalls = maxCalls;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (variables !== undefined) {
      updateData.variables = Array.isArray(variables)
        ? variables
            .filter((v) => v && v.key && v.value)
            .map((v) => ({
              key: String(v.key).trim(),
              source: v.source === "field" ? "field" : "static",
              value: String(v.value).trim(),
            }))
        : [];
    }

    if (passwordRequired !== undefined) {
      updateData.passwordRequired = passwordRequired;
      // Only update password hash if password is provided
      if (passwordRequired && password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      } else if (!passwordRequired) {
        updateData.passwordHash = null;
      }
    }

    const demoPage = await DemoPage.findByIdAndUpdate(
      params?.id,
      updateData,
      { new: true, runValidators: true },
    )
      .populate("bolchoTokenId", "name")
      .populate("assistantId", "name assistantId")
      .populate("phoneNumberId", "name phoneNumberId");

    if (!demoPage) {
      return NextResponse.json({ error: "Demo page not found" }, { status: 404 });
    }

    return NextResponse.json(demoPage);
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Demo page with this slug already exists" },
        { status: 409 },
      );
    }
    console.error("Error updating demo page:", error);
    return NextResponse.json(
      { error: "Failed to update demo page", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request, context) {
  try {
    await dbConnect();
    const params = await Promise.resolve(context.params);
    const demoPage = await DemoPage.findByIdAndDelete(params?.id);
    if (!demoPage) {
      return NextResponse.json({ error: "Demo page not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Demo page deleted successfully" });
  } catch (error) {
    console.error("Error deleting demo page:", error);
    return NextResponse.json(
      { error: "Failed to delete demo page" },
      { status: 500 },
    );
  }
}

