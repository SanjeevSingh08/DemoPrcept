import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  const secret = process.env.DEMO_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "Missing DEMO_JWT_SECRET. Set it in .env.local (see ENV_SETUP.md).",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signDemoSession(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyDemoSession(token, slug) {
  const { payload } = await jwtVerify(token, getSecret());
  // Verify the slug matches
  if (payload.slug !== slug) {
    throw new Error("Invalid session");
  }
  return payload;
}


