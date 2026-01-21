import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { Assistant } from "@/lib/models/Assistant";

// GET all assistants
export async function GET() {
  try {
    await dbConnect();
    const assistants = await Assistant.find().sort({ createdAt: -1 });
    return NextResponse.json(assistants);
  } catch (error) {
    console.error("Error fetching assistants:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistants" },
      { status: 500 },
    );
  }
}

// POST create new assistant (manual entry)
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, assistantId } = body;

    if (!name || !assistantId) {
      return NextResponse.json(
        { error: "name and assistantId are required" },
        { status: 400 },
      );
    }

    const assistant = await Assistant.create({ name, assistantId });
    return NextResponse.json(assistant, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Assistant with this ID already exists" },
        { status: 409 },
      );
    }
    console.error("Error creating assistant:", error);
    return NextResponse.json(
      { error: "Failed to create assistant" },
      { status: 500 },
    );
  }
}

