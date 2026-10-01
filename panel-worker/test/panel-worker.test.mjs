import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest, routePolicy } from "../src/index.js";

const encoder = new TextEncoder();

function base64Url(value) {
  const bytes = typeof value === "string" ? encoder.encode(value) : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

async function testIdentity(email = "ania@example.test") {
  const pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"]
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  publicJwk.kid = crypto.randomUUID();
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT", kid: publicJwk.kid }));
  const payload = base64Url(JSON.stringify({
    iss: "https://example.cloudflareaccess.com",
    aud: ["Panel-Audience-AbC"],
    email,
    iat: now,
    exp: now + 3600
  }));
  const input = `${header}.${payload}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, encoder.encode(input));
  return { token: `${input}.${base64Url(signature)}`, publicJwk };
}

async function envFor(email = "ania@example.test") {
  const identity = await testIdentity(email);
  const upstreamCalls = [];
  return {
    identity,
    upstreamCalls,
    env: {
      ACCESS_TEAM_DOMAIN: "example.cloudflareaccess.com",
      ACCESS_AUD: "Panel-Audience-AbC",
      ADMIN_EMAILS: "mariusz@example.test",
      OPERATOR_EMAILS: "ania@example.test",
      ADMIN_DISPLAY_NAME: "Mariusz",
      OPERATOR_DISPLAY_NAME: "Ania",
      API_ORIGIN: "https://api.example.test",
      ADMIN_TOKEN: "server-only-secret",
      ACCESS_JWKS: {
        fetch: async () => new Response(JSON.stringify({ keys: [identity.publicJwk] }), {
          headers: { "Content-Type": "application/json", "Cache-Control": "max-age=60" }
        })
      },
      UPSTREAM: {
        fetch: async (request) => {
          upstreamCalls.push(request);
          return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
        }
      },
      ASSETS: {
        fetch: async () => new Response("<!doctype html><title>Panel</title>", { headers: { "Content-Type": "text/html" } })
      }
    }
  };
}

function request(path, token, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cf-Access-Jwt-Assertion", token);
  if (init.method && !["GET", "HEAD"].includes(init.method) && !headers.has("Origin")) {
    headers.set("Origin", "https://panel.example.test");
  }
  return new Request(`https://panel.example.test${path}`, { ...init, headers });
}

test("allowlist nie udostępnia nieznanych tras", () => {
  assert.equal(routePolicy("/api/admin/secret", "GET"), null);
  assert.equal(routePolicy("/api/submissions", "GET").upstream, "/submissions");
});

test("sesja zwraca wyłącznie rolę i krótką nazwę konta", async () => {
  const { env, identity } = await envFor();
  const response = await handleRequest(request("/api/session", identity.token), env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.user, { email: "ania@example.test", name: "Ania", role: "operator" });
});

test("operator nie ma dostępu do kopii administracyjnej", async () => {
  const { env, identity, upstreamCalls } = await envFor();
  const response = await handleRequest(request("/api/admin/backup", identity.token), env);
  assert.equal(response.status, 403);
  assert.equal(upstreamCalls.length, 0);
});

test("operator nie może zmienić blokady retencji", async () => {
  const { env, identity, upstreamCalls } = await envFor();
  const id = "01234567-89ab-4cde-8fab-0123456789ab";
  const response = await handleRequest(request(`/api/submissions/${id}`, identity.token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ retention_hold: true })
  }), env);
  assert.equal(response.status, 403);
  assert.equal(upstreamCalls.length, 0);
});

test("operator może pobrać sprawy, a token backendu nie pochodzi z przeglądarki", async () => {
  const { env, identity, upstreamCalls } = await envFor();
  const response = await handleRequest(request("/api/submissions", identity.token, {
    headers: { Authorization: "Bearer browser-value" }
  }), env);
  assert.equal(response.status, 200);
  assert.equal(upstreamCalls.length, 1);
  assert.equal(upstreamCalls[0].headers.get("Authorization"), "Bearer server-only-secret");
  assert.equal(upstreamCalls[0].headers.get("Cf-Access-Jwt-Assertion"), null);
  assert.equal(upstreamCalls[0].headers.get("X-Panel-Actor"), "ania@example.test");
});

test("operator nie może oznaczyć zwrotu płatności", async () => {
  const { env, identity, upstreamCalls } = await envFor();
  const id = "01234567-89ab-4cde-8fab-0123456789ab";
  const response = await handleRequest(request(`/api/submissions/${id}/workflow`, identity.token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "mark_refunded" })
  }), env);
  assert.equal(response.status, 403);
  assert.equal(upstreamCalls.length, 0);
});

test("żądanie zapisu spoza domeny panelu jest odrzucane", async () => {
  const { env, identity, upstreamCalls } = await envFor();
  const id = "01234567-89ab-4cde-8fab-0123456789ab";
  const response = await handleRequest(request(`/api/submissions/${id}/workflow`, identity.token, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
    body: JSON.stringify({ action: "mark_paid" })
  }), env);
  assert.equal(response.status, 403);
  assert.equal(upstreamCalls.length, 0);
});

test("administrator może wykonać operację administracyjną", async () => {
  const { env, identity, upstreamCalls } = await envFor("mariusz@example.test");
  const id = "01234567-89ab-4cde-8fab-0123456789ab";
  const response = await handleRequest(request(`/api/submissions/${id}`, identity.token, {
    method: "DELETE"
  }), env);
  assert.equal(response.status, 200);
  assert.equal(upstreamCalls.length, 1);
  assert.equal(upstreamCalls[0].method, "DELETE");
});

test("brak tokenu Access jest odrzucany przed zasobami panelu", async () => {
  const { env } = await envFor();
  const response = await handleRequest(new Request("https://panel.example.test/"), env);
  assert.equal(response.status, 401);
});
