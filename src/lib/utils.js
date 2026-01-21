export function maskSecret(secret) {
  if (!secret) return "";
  if (secret.length <= 8) return "********";
  return `${secret.slice(0, 4)}…${secret.slice(-4)}`;
}

export function safeRedirectBack(request, fallback = "/admin") {
  const referer = request.headers.get("referer");
  try {
    if (!referer) return fallback;
    const url = new URL(referer);
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}


