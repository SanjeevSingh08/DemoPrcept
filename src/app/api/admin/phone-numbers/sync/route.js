import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { BolchoToken } from "@/lib/models/BolchoToken";
import { PhoneNumber } from "@/lib/models/PhoneNumber";

const BOLCHO_API_BASE = "https://api.bolcho.ai/v1";

export async function POST(request) {
  try {
    await dbConnect();

    const { tokenId } = await request.json();

    if (!tokenId) {
      return NextResponse.json(
        { error: "tokenId is required" },
        { status: 400 },
      );
    }

    // Get the token from DB
    const tokenDoc = await BolchoToken.findById(tokenId);
    if (!tokenDoc || !tokenDoc.isActive) {
      return NextResponse.json(
        { error: "Token not found or inactive" },
        { status: 404 },
      );
    }

    // Fetch phone numbers from Bolcho API
    const response = await fetch(
      `${BOLCHO_API_BASE}/phone-numbers?status=active&limit=50&skip=0`,
      {
        headers: {
          Authorization: `Bearer ${tokenDoc.value}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: "Failed to fetch phone numbers from Bolcho API",
          details: errorText,
        },
        { status: response.status },
      );
    }

    const phoneNumbers = await response.json();

    if (!Array.isArray(phoneNumbers)) {
      return NextResponse.json(
        { error: "Invalid response from Bolcho API" },
        { status: 500 },
      );
    }

    // Upsert phone numbers into DB
    const results = {
      created: 0,
      updated: 0,
      errors: [],
    };

    for (const phone of phoneNumbers) {
      try {
        const result = await PhoneNumber.findOneAndUpdate(
          { phoneNumberId: phone.phone_number_id },
          {
            name: phone.friendly_name || phone.number || "Unnamed Number",
            phoneNumberId: phone.phone_number_id,
            phoneNumber: phone.number,
            isActive: phone.status === "active",
          },
          { upsert: true, new: true },
        );

        if (result.isNew) {
          results.created++;
        } else {
          results.updated++;
        }
      } catch (err) {
        results.errors.push({
          phoneNumberId: phone.phone_number_id,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${phoneNumbers.length} phone numbers`,
      results,
    });
  } catch (error) {
    console.error("Error syncing phone numbers:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}

