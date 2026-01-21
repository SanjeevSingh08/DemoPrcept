import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI. Set it in .env.local (see ENV_SETUP.md).",
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads in dev.
 * @type {{ conn: import("mongoose").Mongoose | null, promise: Promise<import("mongoose").Mongoose> | null }}
 */
let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}


