import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { BolchoToken } from "@/lib/models/BolchoToken";

export async function GET() {
  try {
    await dbConnect();
    const tokens = await BolchoToken.find().sort({ createdAt: -1 });
    // Don't send the actual token value for security
    const safeTokens = tokens.map((t) => ({
      _id: t._id,
      name: t.name,
      isActive: t.isActive,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
    return NextResponse.json(safeTokens);
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, value } = body;

    if (!name || !value) {
      return NextResponse.json(
        { error: "name and value are required" },
        { status: 400 },
      );
    }

    const token = await BolchoToken.create({ name, value });
    return NextResponse.json(
      {
        _id: token._id,
        name: token.name,
        isActive: token.isActive,
        createdAt: token.createdAt,
        updatedAt: token.updatedAt,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Token with this name already exists" },
        { status: 409 },
      );
    }
    console.error("Error creating token:", error);
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 },
    );
  }
}

