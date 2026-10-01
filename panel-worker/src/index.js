const ACCESS_HEADER = "Cf-Access-Jwt-Assertion";
const CLOCK_TOLERANCE_SECONDS = 30;
const DEFAULT_JWKS_TTL_MS = 5 * 60 * 1000;
const MAX_JWKS_TTL_MS = 60 * 60 * 1000;
const jwksCache = new Map();

const OPERATOR_WORKFLOW_ACTIONS = new Set([
  "resend_payment_instructions",
  "mark_paid",
  "materials_incomplete",
  "materials_complete",
  "start_fulfillment",
  "complete_service"
]);

const ADMIN_WORKFLOW_ACTIONS = new Set([
  ...OPERATOR_WORKFLOW_ACTIONS,
  "mark_refunded",
  "extend_deadline",
  "close_no_purchase"
]);

const OPERATOR_PATCH_KEYS = new Set(["status", "is_read", "admin_notes"]);
const ADMIN_PATCH_KEYS = new Set([
  ...OPERATOR_PATCH_KEYS,
  "retention_hold",
  "payment_status",
  "closure_reason"
]);

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers
    }
  });
}

function splitList(value) {
  return String(value || "")
    .split(/[;,\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function splitRawList(value) {
  return String(value || "")
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTeamDomain(value) {
  const raw = String(value || "").trim().replace(/\/+$/g, "");
  if (!raw || /uzupelnij/i.test(raw)) return "";
  const withProtocol = /^https:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "https:" || url.pathname !== "/") return "";
    return url.origin;
  } catch {
    return "";
  }
}

function accessAudiences(env) {
  return splitRawList(env.ACCESS_AUD).filter((value) => !/uzupelnij/i.test(value));
}

function base64UrlBytes(value) {
  const normalized = String(value || "").replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(normalized + "=".repeat((4 - (normalized.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJsonPart(value) {
  return JSON.parse(new TextDecoder().decode(base64UrlBytes(value)));
}

function parseMaxAge(cacheControl) {
  const match = String(cacheControl || "").match(/(?:^|,)\s*max-age=(\d+)/i);
  if (!match) return DEFAULT_JWKS_TTL_MS;
  return Math.min(Number(match[1]) * 1000, MAX_JWKS_TTL_MS);
}

async function loadJwks(teamOrigin, env, force = false) {
  const cached = jwksCache.get(teamOrigin);
  if (!force && cached && cached.expiresAt > Date.now()) return cached.keys;

  const jwksUrl = `${teamOrigin}/cdn-cgi/access/certs`;
  const fetcher = env.ACCESS_JWKS && typeof env.ACCESS_JWKS.fetch === "function"
    ? env.ACCESS_JWKS.fetch.bind(env.ACCESS_JWKS)
    : fetch;
  const response = await fetcher(jwksUrl, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error("Nie udało się pobrać kluczy Cloudflare Access.");
  const body = await response.json();
  if (!Array.isArray(body?.keys) || !body.keys.length) {
    throw new Error("Cloudflare Access zwrócił nieprawidłowy zestaw kluczy.");
  }

  jwksCache.set(teamOrigin, {
    keys: body.keys,
    expiresAt: Date.now() + parseMaxAge(response.headers.get("Cache-Control"))
  });
  return body.keys;
}

function audienceMatches(claim, expected) {
  const values = Array.isArray(claim) ? claim : [claim];
  return values.some((value) => expected.includes(String(value || "")));
}

async function verifyAccessJwt(token, env) {
  const teamOrigin = normalizeTeamDomain(env.ACCESS_TEAM_DOMAIN);
  const expectedAudiences = accessAudiences(env);
  if (!teamOrigin || !expectedAudiences.length) {
    throw Object.assign(new Error("Cloudflare Access nie jest jeszcze skonfigurowany."), { status: 503 });
  }

  const parts = String(token || "").split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw Object.assign(new Error("Brak prawidłowej sesji Cloudflare Access."), { status: 401 });
  }

  let header;
  let payload;
  try {
    header = decodeJsonPart(parts[0]);
    payload = decodeJsonPart(parts[1]);
  } catch {
    throw Object.assign(new Error("Nieprawidłowy token Cloudflare Access."), { status: 401 });
  }

  if (header.alg !== "RS256" || !header.kid) {
    throw Object.assign(new Error("Nieobsługiwany token Cloudflare Access."), { status: 401 });
  }

  let keys = await loadJwks(teamOrigin, env);
  let jwk = keys.find((key) => key.kid === header.kid && (!key.alg || key.alg === "RS256"));
  if (!jwk) {
    keys = await loadJwks(teamOrigin, env, true);
    jwk = keys.find((key) => key.kid === header.kid && (!key.alg || key.alg === "RS256"));
  }
  if (!jwk) {
    throw Object.assign(new Error("Nie znaleziono klucza sesji Cloudflare Access."), { status: 401 });
  }

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    base64UrlBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  );
  if (!verified) {
    throw Object.assign(new Error("Nie udało się potwierdzić sesji Cloudflare Access."), { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  const issuer = String(payload.iss || "").replace(/\/+$/g, "");
  if (issuer !== teamOrigin) {
    throw Object.assign(new Error("Token pochodzi z innej organizacji Cloudflare Access."), { status: 401 });
  }
  if (!audienceMatches(payload.aud, expectedAudiences)) {
    throw Object.assign(new Error("Token nie jest przeznaczony dla tego panelu."), { status: 401 });
  }
  if (!Number.isFinite(payload.exp) || payload.exp < now - CLOCK_TOLERANCE_SECONDS) {
    throw Object.assign(new Error("Sesja Cloudflare Access wygasła."), { status: 401 });
  }
  if (Number.isFinite(payload.nbf) && payload.nbf > now + CLOCK_TOLERANCE_SECONDS) {
    throw Object.assign(new Error("Sesja Cloudflare Access nie jest jeszcze aktywna."), { status: 401 });
  }

  const email = String(payload.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw Object.assign(new Error("Sesja nie zawiera zweryfikowanego adresu e-mail."), { status: 401 });
  }
  return { ...payload, email };
}

function resolveUser(claims, env) {
  const admins = new Set(splitList(env.ADMIN_EMAILS).filter((value) => !/uzupelnij/i.test(value)));
  const operators = new Set(splitList(env.OPERATOR_EMAILS).filter((value) => !/uzupelnij/i.test(value)));
  if (!admins.size || !operators.size) {
    throw Object.assign(new Error("Lista użytkowników panelu nie jest jeszcze skonfigurowana."), { status: 503 });
  }

  if (admins.has(claims.email)) {
    return {
      email: claims.email,
      name: String(env.ADMIN_DISPLAY_NAME || "Mariusz").trim() || "Mariusz",
      role: "admin"
    };
  }
  if (operators.has(claims.email)) {
    return {
      email: claims.email,
      name: String(env.OPERATOR_DISPLAY_NAME || "Ania").trim() || "Ania",
      role: "operator"
    };
  }
  throw Object.assign(new Error("To konto nie ma dostępu do panelu."), { status: 403 });
}

function isUuidPath(value) {
  return "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
}

function routePolicy(pathname, method) {
  const uuid = isUuidPath();
  if (pathname === "/api/health" && method === "GET") return { roles: ["operator", "admin"], upstream: "/health" };
  if (pathname === "/api/submissions" && method === "GET") return { roles: ["operator", "admin"], upstream: "/submissions" };
  if (new RegExp(`^/api/submissions/${uuid}$`, "i").test(pathname) && method === "PATCH") {
    return { roles: ["operator", "admin"], upstream: pathname.slice(4), validate: "patch" };
  }
  if (new RegExp(`^/api/submissions/${uuid}$`, "i").test(pathname) && method === "DELETE") {
    return { roles: ["admin"], upstream: pathname.slice(4) };
  }
  if (new RegExp(`^/api/submissions/${uuid}/events$`, "i").test(pathname) && method === "GET") {
    return { roles: ["operator", "admin"], upstream: pathname.slice(4) };
  }
  if (new RegExp(`^/api/submissions/${uuid}/workflow$`, "i").test(pathname) && method === "POST") {
    return { roles: ["operator", "admin"], upstream: pathname.slice(4), validate: "workflow" };
  }
  if (new RegExp(`^/api/submissions/${uuid}/attachments$`, "i").test(pathname) && ["GET", "POST"].includes(method)) {
    return { roles: ["operator", "admin"], upstream: pathname.slice(4) };
  }
  if (new RegExp(`^/api/submissions/${uuid}/attachments/${uuid}$`, "i").test(pathname) && ["GET", "DELETE"].includes(method)) {
    return { roles: ["operator", "admin"], upstream: pathname.slice(4) };
  }
  if (pathname === "/api/admin/invitations" && ["GET", "POST"].includes(method)) {
    return { roles: ["operator", "admin"], upstream: pathname.slice(4) };
  }
  if (new RegExp(`^/api/admin/invitations/${uuid}$`, "i").test(pathname) && method === "DELETE") {
    return { roles: ["operator", "admin"], upstream: pathname.slice(4) };
  }
  if (pathname === "/api/admin/backup" && method === "GET") return { roles: ["admin"], upstream: "/admin/backup" };
  if (pathname === "/api/admin/retention-report" && method === "GET") return { roles: ["admin"], upstream: "/admin/retention-report" };
  if (pathname === "/api/admin/archive/process" && method === "POST") return { roles: ["admin"], upstream: "/admin/archive/process" };
  if (pathname === "/api/admin/archive" && method === "GET") return { roles: ["admin"], upstream: "/admin/archive" };
  if (new RegExp(`^/api/admin/archive/${uuid}(?:/attachments/${uuid})?$`, "i").test(pathname) && method === "GET") {
    return { roles: ["admin"], upstream: pathname.slice(4) };
  }
  return null;
}

async function validatedBody(request, policy, role) {
  if (!policy.validate) return request.body;
  let body;
  try {
    body = await request.json();
  } catch {
    throw Object.assign(new Error("Żądanie musi zawierać prawidłowy JSON."), { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw Object.assign(new Error("Nieprawidłowe dane operacji."), { status: 400 });
  }

  if (policy.validate === "patch") {
    const allowed = role === "admin" ? ADMIN_PATCH_KEYS : OPERATOR_PATCH_KEYS;
    const keys = Object.keys(body);
    if (!keys.length || keys.some((key) => !allowed.has(key))) {
      throw Object.assign(new Error("Ta rola nie może zmienić wskazanych pól."), { status: 403 });
    }
  }
  if (policy.validate === "workflow") {
    const actions = role === "admin" ? ADMIN_WORKFLOW_ACTIONS : OPERATOR_WORKFLOW_ACTIONS;
    if (!actions.has(String(body.action || ""))) {
      throw Object.assign(new Error("Ta rola nie może wykonać wskazanej operacji."), { status: 403 });
    }
  }
  return JSON.stringify(body);
}

function apiOrigin(env) {
  const raw = String(env.API_ORIGIN || "").trim().replace(/\/+$/g, "");
  if (!raw) throw Object.assign(new Error("Adres istniejącego Workera nie jest skonfigurowany."), { status: 503 });
  const url = new URL(raw);
  if (url.protocol !== "https:") throw Object.assign(new Error("Adres Workera musi używać HTTPS."), { status: 503 });
  return url.origin;
}

function assertSameOrigin(request) {
  if (["GET", "HEAD"].includes(request.method)) return;
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) {
    throw Object.assign(new Error("Odrzucono żądanie spoza panelu."), { status: 403 });
  }
}

async function proxyApi(request, env, policy, user) {
  if (!policy.roles.includes(user.role)) {
    return json({ error: "Brak uprawnień do tej operacji." }, 403);
  }
  if (!String(env.ADMIN_TOKEN || "")) {
    return json({ error: "Połączenie panelu z obecnym Workerem nie jest jeszcze skonfigurowane." }, 503);
  }

  try {
    assertSameOrigin(request);
    const body = await validatedBody(request, policy, user.role);
    const sourceUrl = new URL(request.url);
    const target = new URL(policy.upstream, apiOrigin(env));
    target.search = sourceUrl.search;

    const headers = new Headers(request.headers);
    [
      "Authorization",
      "Cookie",
      ACCESS_HEADER,
      "Cf-Access-Authenticated-User-Email",
      "Host",
      "Origin",
      "Content-Length",
      "Sec-Fetch-Site",
      "Sec-Fetch-Mode",
      "Sec-Fetch-Dest"
    ].forEach((name) => headers.delete(name));
    headers.set("Authorization", `Bearer ${env.ADMIN_TOKEN}`);
    headers.set("X-Panel-Actor", user.email);
    headers.set("X-Panel-Role", user.role);

    const init = { method: request.method, headers, redirect: "manual" };
    if (!["GET", "HEAD"].includes(request.method)) init.body = body;
    const fetcher = env.UPSTREAM && typeof env.UPSTREAM.fetch === "function"
      ? env.UPSTREAM.fetch.bind(env.UPSTREAM)
      : fetch;
    const upstream = await fetcher(new Request(target, init));
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set("Cache-Control", "no-store");
    responseHeaders.set("X-Content-Type-Options", "nosniff");
    responseHeaders.delete("Access-Control-Allow-Origin");
    responseHeaders.delete("Access-Control-Allow-Credentials");
    responseHeaders.delete("Set-Cookie");
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    return json({ error: error.message || "Nie udało się wykonać operacji." }, Number(error.status) || 502);
  }
}

function securityHeaders(response, { html = false } = {}) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://pogotowieupadlosciowe.pl; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests");
  if (html) headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function accessError(error, apiRequest) {
  const status = Number(error.status) || 401;
  if (apiRequest) return json({ error: error.message || "Brak dostępu." }, status);
  const message = String(error.message || "Brak dostępu.")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return securityHeaders(new Response(`<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Brak dostępu</title><style>body{font:16px system-ui;margin:0;background:#f2f5f9;color:#10213a;display:grid;min-height:100vh;place-items:center}.box{max-width:560px;margin:24px;padding:32px;border:1px solid #dce4ef;border-radius:18px;background:#fff;box-shadow:0 12px 36px #081f401f}h1{margin-top:0;font-size:1.5rem}p{line-height:1.6}</style><main class="box"><h1>Panel jest niedostępny</h1><p>${message}</p><p>Jeśli konto powinno mieć dostęp, skontaktuj się z administratorem panelu.</p></main></html>`, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  }), { html: true });
}

async function serveAsset(request, env) {
  if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") {
    return json({ error: "Brak zasobów panelu." }, 503);
  }
  const url = new URL(request.url);
  if (url.pathname === "/") url.pathname = "/index.html";
  const response = await env.ASSETS.fetch(new Request(url.toString(), {
    method: request.method,
    headers: request.headers
  }));
  const contentType = response.headers.get("Content-Type") || "";
  return securityHeaders(response, { html: contentType.includes("text/html") });
}

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  const isApi = url.pathname.startsWith("/api/");

  let claims;
  let user;
  try {
    claims = await verifyAccessJwt(request.headers.get(ACCESS_HEADER), env);
    user = resolveUser(claims, env);
  } catch (error) {
    return accessError(error, isApi);
  }

  if (url.pathname === "/api/session" && request.method === "GET") {
    return json({
      authenticated: true,
      user,
      expires_at: new Date(Number(claims.exp) * 1000).toISOString()
    });
  }

  if (isApi) {
    const policy = routePolicy(url.pathname, request.method);
    if (!policy) return json({ error: "Ta operacja nie jest udostępniona przez panel." }, 404);
    return proxyApi(request, env, policy, user);
  }
  if (!["GET", "HEAD"].includes(request.method)) return new Response(null, { status: 405 });
  return serveAsset(request, env);
}

export { routePolicy, resolveUser, verifyAccessJwt };

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  }
};
