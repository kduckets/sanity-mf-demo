import { headers } from "next/headers";

// Derives the current request's origin from headers rather than hardcoding
// localhost, so the same code works unmodified on any deployment (Vercel,
// elsewhere, or plain `next start` locally) without environment-specific
// config.
export async function getSiteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "http://localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
