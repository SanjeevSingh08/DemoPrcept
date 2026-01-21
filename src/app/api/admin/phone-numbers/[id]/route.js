import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { PhoneNumber } from "@/lib/models/PhoneNumber";

export async function GET(request, context) {
  try {
    await dbConnect();
    const params = await Promise.resolve(context.params);
    const phone = await PhoneNumber.findById(params?.id);
    if (!phone) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
    }
    return NextResponse.json(phone);
  } catch (error) {
    console.error("Error fetching phone number:", error);
    return NextResponse.json(
      { error: "Failed to fetch phone number" },
      { status: 500 },
    );
  }
}

export async function PUT(request, context) {
  try {
    await dbConnect();
    const params = await Promise.resolve(context.params);
    const body = await request.json();
    const { name, phoneNumberId, phoneNumber, isActive } = body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phoneNumberId !== undefined) updateData.phoneNumberId = phoneNumberId;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (isActive !== undefined) updateData.isActive = isActive;

    const phone = await PhoneNumber.findByIdAndUpdate(
      params?.id,
      updateData,
      { new: true, runValidators: true },
    );

    if (!phone) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
    }

    return NextResponse.json(phone);
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Phone number with this ID already exists" },
        { status: 409 },
      );
    }
    console.error("Error updating phone number:", error);
    return NextResponse.json(
      { error: "Failed to update phone number" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, context) {
  try {
    await dbConnect();
    const params = await Promise.resolve(context.params);
    const phone = await PhoneNumber.findByIdAndDelete(params?.id);
    if (!phone) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Phone number deleted successfully" });
  } catch (error) {
    console.error("Error deleting phone number:", error);
    return NextResponse.json(
      { error: "Failed to delete phone number" },
      { status: 500 },
    );
  }
}

