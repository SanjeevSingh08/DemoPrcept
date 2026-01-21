import { SignJWT, jwtVerify } from "jose";

const cookieName = "admin_session";

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "Missing ADMIN_JWT_SECRET. Set it in .env.local (see ENV_SETUP.md).",
    );
  }
  return new TextEncoder().encode(secret);
}

export function getAdminSessionCookieName() {
  return cookieName;
}

export async function signAdminSession(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAdminSession(token) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}


