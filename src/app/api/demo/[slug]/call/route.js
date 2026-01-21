import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { DemoPage } from "@/lib/models/DemoPage";
import { BolchoToken } from "@/lib/models/BolchoToken";
import { Assistant } from "@/lib/models/Assistant";
import { PhoneNumber } from "@/lib/models/PhoneNumber";
import { verifyDemoSession } from "@/lib/auth/demoSession";
import { normalizeSlug } from "@/lib/slug";

const BOLCHO_API_BASE = "https://api.bolcho.ai/v1";

function isDebugCalls() {
  const v = process.env.DEBUG_CALLS;
  return v === "1" || v === "true" || v === "yes";
}

function redactToken(token) {
  if (!token) return "";
  const s = String(token);
  if (s.length <= 10) return "********";
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

export async function POST(request, context) {
  const reqId =
    (globalThis.crypto && crypto.randomUUID && crypto.randomUUID()) ||
    `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  try {
    await dbConnect();
    const formData = await request.json();
    const params = await Promise.resolve(context.params);
    const slug = normalizeSlug(params?.slug);

    if (isDebugCalls()) {
      console.log(`[demo-call][${reqId}] slug=${slug} incomingFormData=`, formData);
    }

    // Get demo page
    const demoPage = await DemoPage.findOne({ slug, isActive: true })
      .populate("bolchoTokenId")
      .populate("assistantId")
      .populate("phoneNumberId");

    if (!demoPage) {
      return NextResponse.json({ error: "Demo page not found" }, { status: 404 });
    }

    // Check password if required
    if (demoPage.passwordRequired) {
      const cookieName = `demo_${slug}`;
      const token = request.cookies.get(cookieName)?.value;

      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        await verifyDemoSession(token, slug);
      } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Check call limit
    if (demoPage.maxCalls !== null && demoPage.callsMade >= demoPage.maxCalls) {
      return NextResponse.json(
        { error: "Maximum number of calls reached for this demo page" },
        { status: 403 },
      );
    }

    // Validate required fields
    for (const field of demoPage.fields) {
      if (field.required && !formData[field.key]) {
        return NextResponse.json(
          { error: `Field ${field.label} is required` },
          { status: 400 },
        );
      }
    }

    // Get the phone number to call from the form data
    const phoneToCall = formData[demoPage.callToFieldKey];
    if (!phoneToCall) {
      return NextResponse.json(
        { error: "Phone number to call is missing" },
        { status: 400 },
      );
    }

    // Get token, assistant, and phone number
    const token = await BolchoToken.findById(demoPage.bolchoTokenId._id || demoPage.bolchoTokenId);
    const assistant = await Assistant.findById(demoPage.assistantId._id || demoPage.assistantId);
    const phoneNumber = await PhoneNumber.findById(
      demoPage.phoneNumberId._id || demoPage.phoneNumberId,
    );

    if (!token || !token.isActive) {
      return NextResponse.json({ error: "Token not found or inactive" }, { status: 500 });
    }
    if (!assistant || !assistant.isActive) {
      return NextResponse.json({ error: "Assistant not found or inactive" }, { status: 500 });
    }
    if (!phoneNumber || !phoneNumber.isActive) {
      return NextResponse.json({ error: "Phone number not found or inactive" }, { status: 500 });
    }

    // Build variable_values for Bolcho call
    const variableValues = {};

    // Preferred: demoPage.variables (builder-style key/value pairs)
    if (Array.isArray(demoPage.variables) && demoPage.variables.length > 0) {
      for (const v of demoPage.variables) {
        if (!v?.key) continue;
        const varName = String(v.key).trim();
        if (!varName) continue;

        if (v.source === "field") {
          const fieldKey = String(v.value || "").trim();
          const val = formData[fieldKey];
          if (val !== undefined && val !== null && String(val).trim() !== "") {
            variableValues[varName] = val;
          }
        } else {
          const val = String(v.value || "").trim();
          if (val !== "") {
            variableValues[varName] = val;
          }
        }
      }
    } else if (demoPage.variableValues && demoPage.variableValues.size > 0) {
      // Backward compatibility: variableValues Map (bolchoVarName -> formFieldKey)
      const varMap =
        demoPage.variableValues instanceof Map
          ? Object.fromEntries(demoPage.variableValues)
          : demoPage.variableValues;
      for (const [bolchoVarName, formFieldKey] of Object.entries(varMap)) {
        const val = formData[formFieldKey];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          variableValues[bolchoVarName] = val;
        }
      }
    }

    // Format phone number (remove any non-digit characters except +)
    const formattedPhoneNumber = phoneToCall.replace(/[^\d+]/g, "");

    // Make call to Bolcho API
    const callPayload = {
      type: "sip",
      direction: "outbound",
      assistant_id: assistant.assistantId,
      phone_number_id: phoneNumber.phoneNumberId,
      to_number: formattedPhoneNumber,
      variable_values: variableValues,
    };

    if (isDebugCalls()) {
      console.log(
        `[demo-call][${reqId}] usingToken=${redactToken(token.value)} assistant_id=${assistant.assistantId} phone_number_id=${phoneNumber.phoneNumberId}`,
      );
      console.log(`[demo-call][${reqId}] bolchoRequest POST ${BOLCHO_API_BASE}/phone-numbers/call payload=`, callPayload);
    }

    const response = await fetch(`${BOLCHO_API_BASE}/phone-numbers/call`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(callPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[demo-call][${reqId}] bolchoError status=${response.status} body=`, errorText);
      return NextResponse.json(
        {
          error: "Failed to initiate call",
          details: errorText,
        },
        { status: response.status },
      );
    }

    const rawBody = await response.text();
    let callResult = {};
    try {
      callResult = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      callResult = { raw: rawBody };
    }

    if (isDebugCalls()) {
      console.log(`[demo-call][${reqId}] bolchoOk status=${response.status} body=`, callResult);
    }

    // Only increment calls made on successful response
    await DemoPage.findByIdAndUpdate(demoPage._id, {
      $inc: { callsMade: 1 },
    });

    if (isDebugCalls()) {
      console.log(`[demo-call][${reqId}] callsMade incremented for demoPageId=${demoPage._id.toString()}`);
    }

    return NextResponse.json({
      success: true,
      message: "Call initiated successfully",
      callId: callResult.call_id || callResult.id,
      status: callResult.status,
    });
  } catch (error) {
    console.error(`[demo-call][${reqId}] internalError`, error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}

