import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { DemoPage } from "@/lib/models/DemoPage";

export async function POST(request, context) {
  try {
    await dbConnect();
    const params = await Promise.resolve(context.params);
    const demoPage = await DemoPage.findByIdAndUpdate(
      params?.id,
      { callsMade: 0 },
      { new: true },
    );

    if (!demoPage) {
      return NextResponse.json({ error: "Demo page not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Call count reset successfully",
      callsMade: demoPage.callsMade,
    });
  } catch (error) {
    console.error("Error resetting calls:", error);
    return NextResponse.json(
      { error: "Failed to reset call count" },
      { status: 500 },
    );
  }
}

