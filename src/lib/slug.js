export function normalizeSlug(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";

  // Decode if it looks like URL-encoded
  let s = raw;
  try {
    s = decodeURIComponent(raw);
  } catch {
    // ignore
  }

  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}


