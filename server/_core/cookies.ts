import type { CookieOptions, Request } from "express";

const MANUS_PREVIEW_HOSTS = [".manus.space", ".manus.computer"];

function requestHost(req: Request): string {
  return String(req.headers.host ?? "").split(":")[0].toLowerCase();
}

function requestProtocol(req: Request): string {
  const forwarded = req.headers["x-forwarded-proto"];
  const protocol = typeof forwarded === "string"
    ? forwarded.split(",")[0]?.trim()
    : req.protocol;
  return (protocol || "").toLowerCase();
}

function isManusPreview(req: Request): boolean {
  const host = requestHost(req);
  return MANUS_PREVIEW_HOSTS.some(suffix => host.endsWith(suffix));
}

/**
 * Cookie attributes for the application session.
 * Manus Preview is embedded cross-site, so it needs SameSite=None and Secure.
 * A standalone Liara/custom domain is first-party and works more reliably
 * with SameSite=Lax. COOKIE_DOMAIN is intentionally opt-in; host-only cookies
 * are safer and are the correct default for a single production hostname.
 */
export function getSessionCookieOptions(req: Request): CookieOptions {
  const preview = isManusPreview(req);
  const secure = preview || requestProtocol(req) === "https";
  const configuredDomain = process.env.COOKIE_DOMAIN?.trim();

  return {
    httpOnly: true,
    path: "/",
    sameSite: preview ? "none" : "lax",
    secure,
    ...(configuredDomain ? { domain: configuredDomain } : {}),
  };
}
