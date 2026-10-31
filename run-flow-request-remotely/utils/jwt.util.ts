export const GROUP_TOKEN_PREFIX = "mg_";
export const GROUP_TOKEN_TTL_SECONDS = 365 * 24 * 60 * 60;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type McpGroupTokenPayload = {
  sub: string;
  name: string;
  iat: number;
  exp: number;
};

function getSigningSecret(): string {
  const secret = Deno.env.get("MCP_TOKEN_SECRET")?.trim() ||
    Deno.env.get("API_KEY")?.trim();
  if (!secret) {
    throw new Error("MCP_TOKEN_SECRET or API_KEY must be configured");
  }
  return secret;
}

async function getSigningKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSigningSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encodeJson(value: unknown): string {
  return encodeBase64Url(encoder.encode(JSON.stringify(value)));
}

export async function createMcpGroupToken(
  group: { id: string; name: string },
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const payload = encodeJson({
    sub: group.id,
    name: group.name,
    iat: now,
    exp: now + GROUP_TOKEN_TTL_SECONDS,
  });
  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(),
    encoder.encode(signingInput),
  );
  return `${GROUP_TOKEN_PREFIX}${signingInput}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifyMcpGroupToken(
  token: string,
): Promise<McpGroupTokenPayload | null> {
  if (!token.startsWith(GROUP_TOKEN_PREFIX)) return null;

  const parts = token.slice(GROUP_TOKEN_PREFIX.length).split(".");
  if (parts.length !== 3) return null;

  try {
    const header = JSON.parse(
      decoder.decode(decodeBase64Url(parts[0])),
    ) as { alg?: unknown; typ?: unknown };
    if (header.alg !== "HS256" || header.typ !== "JWT") return null;

    const valid = await crypto.subtle.verify(
      "HMAC",
      await getSigningKey(),
      decodeBase64Url(parts[2]),
      encoder.encode(`${parts[0]}.${parts[1]}`),
    );
    if (!valid) return null;

    const payload = JSON.parse(
      decoder.decode(decodeBase64Url(parts[1])),
    ) as Partial<McpGroupTokenPayload>;
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= now
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      name: typeof payload.name === "string" ? payload.name : "",
      iat: typeof payload.iat === "number" ? payload.iat : 0,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
