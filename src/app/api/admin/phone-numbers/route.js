import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { PhoneNumber } from "@/lib/models/PhoneNumber";

export async function GET() {
  try {
    await dbConnect();
    const phoneNumbers = await PhoneNumber.find().sort({ createdAt: -1 });
    return NextResponse.json(phoneNumbers);
  } catch (error) {
    console.error("Error fetching phone numbers:", error);
    return NextResponse.json(
      { error: "Failed to fetch phone numbers" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, phoneNumberId, phoneNumber } = body;

    if (!name || !phoneNumberId) {
      return NextResponse.json(
        { error: "name and phoneNumberId are required" },
        { status: 400 },
      );
    }

    const phone = await PhoneNumber.create({ name, phoneNumberId, phoneNumber });
    return NextResponse.json(phone, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Phone number with this ID already exists" },
        { status: 409 },
      );
    }
    console.error("Error creating phone number:", error);
    return NextResponse.json(
      { error: "Failed to create phone number" },
      { status: 500 },
    );
  }
}

