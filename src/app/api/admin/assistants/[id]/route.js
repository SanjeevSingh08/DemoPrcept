import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { Assistant } from "@/lib/models/Assistant";

// GET single assistant
export async function GET(request, context) {
  try {
    await dbConnect();
    const params = await Promise.resolve(context.params);
    const assistant = await Assistant.findById(params?.id);
    if (!assistant) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
    }
    return NextResponse.json(assistant);
  } catch (error) {
    console.error("Error fetching assistant:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistant" },
      { status: 500 },
    );
  }
}

// PUT update assistant
export async function PUT(request, context) {
  try {
    await dbConnect();
    const params = await Promise.resolve(context.params);
    const body = await request.json();
    const { name, assistantId, isActive } = body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (assistantId !== undefined) updateData.assistantId = assistantId;
    if (isActive !== undefined) updateData.isActive = isActive;

    const assistant = await Assistant.findByIdAndUpdate(
      params?.id,
      updateData,
      { new: true, runValidators: true },
    );

    if (!assistant) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
    }

    return NextResponse.json(assistant);
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Assistant with this ID already exists" },
        { status: 409 },
      );
    }
    console.error("Error updating assistant:", error);
    return NextResponse.json(
      { error: "Failed to update assistant" },
      { status: 500 },
    );
  }
}

// DELETE assistant
export async function DELETE(request, context) {
  try {
    await dbConnect();
    const params = await Promise.resolve(context.params);
    const assistant = await Assistant.findByIdAndDelete(params?.id);
    if (!assistant) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Assistant deleted successfully" });
  } catch (error) {
    console.error("Error deleting assistant:", error);
    return NextResponse.json(
      { error: "Failed to delete assistant" },
      { status: 500 },
    );
  }
}

