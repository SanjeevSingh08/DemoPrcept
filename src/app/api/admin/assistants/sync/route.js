import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { BolchoToken } from "@/lib/models/BolchoToken";
import { Assistant } from "@/lib/models/Assistant";

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

    // Fetch assistants from Bolcho API
    const response = await fetch(
      `${BOLCHO_API_BASE}/assistants?limit=100&status=active`,
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
          error: "Failed to fetch assistants from Bolcho API",
          details: errorText,
        },
        { status: response.status },
      );
    }

    const assistants = await response.json();

    if (!Array.isArray(assistants)) {
      return NextResponse.json(
        { error: "Invalid response from Bolcho API" },
        { status: 500 },
      );
    }

    // Upsert assistants into DB
    const results = {
      created: 0,
      updated: 0,
      errors: [],
    };

    for (const assistant of assistants) {
      try {
        const result = await Assistant.findOneAndUpdate(
          { assistantId: assistant.assistant_id },
          {
            name: assistant.name || "Unnamed Assistant",
            assistantId: assistant.assistant_id,
            isActive: assistant.status === "active",
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
          assistantId: assistant.assistant_id,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${assistants.length} assistants`,
      results,
    });
  } catch (error) {
    console.error("Error syncing assistants:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}

