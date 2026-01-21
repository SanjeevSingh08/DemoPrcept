import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { BolchoToken } from "@/lib/models/BolchoToken";

export async function GET(request, context) {
  try {
    await dbConnect();
    const params = await Promise.resolve(context.params);
    const token = await BolchoToken.findById(params?.id);
    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }
    // Don't send the actual token value
    return NextResponse.json({
      _id: token._id,
      name: token.name,
      isActive: token.isActive,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching token:", error);
    return NextResponse.json(
      { error: "Failed to fetch token" },
      { status: 500 },
    );
  }
}

export async function PUT(request, context) {
  try {
    await dbConnect();
    const params = await Promise.resolve(context.params);
    const body = await request.json();
    const { name, value, isActive } = body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (value !== undefined) updateData.value = value;
    if (isActive !== undefined) updateData.isActive = isActive;

    const token = await BolchoToken.findByIdAndUpdate(
      params?.id,
      updateData,
      { new: true, runValidators: true },
    );

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    return NextResponse.json({
      _id: token._id,
      name: token.name,
      isActive: token.isActive,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
    });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Token with this name already exists" },
        { status: 409 },
      );
    }
    console.error("Error updating token:", error);
    return NextResponse.json(
      { error: "Failed to update token" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, context) {
  try {
    await dbConnect();
    const params = await Promise.resolve(context.params);
    const token = await BolchoToken.findByIdAndDelete(params?.id);
    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Token deleted successfully" });
  } catch (error) {
    console.error("Error deleting token:", error);
    return NextResponse.json(
      { error: "Failed to delete token" },
      { status: 500 },
    );
  }
}

