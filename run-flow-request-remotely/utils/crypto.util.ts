/**
 * AES-256-GCM symmetric encryption utilities for flow blobs.
 *
 * Encrypted values are stored as self-describing strings:
 *   enc:v1:<iv_hex>:<ciphertext_hex>
 *
 * The prefix makes it trivial to detect encrypted vs. legacy plain-text rows
 * so both can be handled transparently during the transition period.
 *
 * ENCRYPT_KEY must be a 64-character lowercase hex string (32 bytes).
 * Generate one with: openssl rand -hex 32
 */

const ENCRYPTED_PREFIX = "enc:v1:";
const KEY_HEX_LENGTH = 64; // 32 bytes * 2 hex chars per byte
const IV_BYTE_LENGTH = 12; // 96-bit IV recommended for AES-GCM

// Module-level cache so the key is imported from raw bytes only once.
let cachedKey: CryptoKey | null = null;

/** Converts a hex string to a Uint8Array. */
function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string: odd length");
  }
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Converts a Uint8Array to a lowercase hex string. */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Reads and validates ENCRYPT_KEY from the environment, then imports it as a
 * CryptoKey suitable for AES-256-GCM. The result is cached after the first
 * successful import.
 *
 * Throws a descriptive Error if the variable is missing or malformed.
 */
export async function getEncryptKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const raw = Deno.env.get("ENCRYPT_KEY");

  if (!raw) {
    throw new Error(
      "ENCRYPT_KEY environment variable is not set. " +
        "Generate a key with: openssl rand -hex 32",
    );
  }

  if (raw.length !== KEY_HEX_LENGTH || !/^[0-9a-fA-F]+$/.test(raw)) {
    throw new Error(
      `ENCRYPT_KEY must be a ${KEY_HEX_LENGTH}-character hex string (32 bytes). ` +
        `Got a string of length ${raw.length}. ` +
        "Generate a valid key with: openssl rand -hex 32",
    );
  }

  const keyBytes = hexToBytes(raw);
  cachedKey = await globalThis.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false, // not extractable
    ["encrypt", "decrypt"],
  );

  return cachedKey;
}

/**
 * Resets the in-memory key cache. Useful in tests to simulate different
 * ENCRYPT_KEY values across test cases.
 */
export function resetKeyCache(): void {
  cachedKey = null;
}

/**
 * Serializes `flow` to JSON and encrypts it with AES-256-GCM.
 *
 * Returns a string in the format:
 *   enc:v1:<iv_hex>:<ciphertext_hex>
 */
export async function encryptFlowBlob(flow: unknown): Promise<string> {
  const key = await getEncryptKey();
  const iv = new Uint8Array(new ArrayBuffer(IV_BYTE_LENGTH));
  globalThis.crypto.getRandomValues(iv);
  const plaintext = new TextEncoder().encode(JSON.stringify(flow));

  const cipherBuffer = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext,
  );

  const ivHex = bytesToHex(iv);
  const ciphertextHex = bytesToHex(new Uint8Array(cipherBuffer));
  return `${ENCRYPTED_PREFIX}${ivHex}:${ciphertextHex}`;
}

/**
 * JSONB columns require valid JSON input. Store encrypted blobs as JSON string
 * scalars so PostgreSQL accepts them and the pg driver reads them back as
 * ordinary strings for maybeDecryptFlowBlob.
 */
export async function encryptFlowBlobForJsonb(flow: unknown): Promise<string> {
  return JSON.stringify(await encryptFlowBlob(flow));
}

/** Encode an existing value as valid JSONB input without changing its value. */
export function encodeJsonbValue(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Decrypts a string previously produced by `encryptFlowBlob`.
 *
 * Throws if the format is invalid or decryption fails (e.g., wrong key or
 * tampered ciphertext — AES-GCM provides authentication).
 */
export async function decryptFlowBlob(encrypted: string): Promise<unknown> {
  if (!encrypted.startsWith(ENCRYPTED_PREFIX)) {
    throw new Error(
      `decryptFlowBlob: value does not start with expected prefix "${ENCRYPTED_PREFIX}"`,
    );
  }

  const withoutPrefix = encrypted.slice(ENCRYPTED_PREFIX.length);
  const colonIndex = withoutPrefix.indexOf(":");
  if (colonIndex === -1) {
    throw new Error(
      "decryptFlowBlob: malformed encrypted value — missing IV/ciphertext separator",
    );
  }

  const ivHex = withoutPrefix.slice(0, colonIndex);
  const ciphertextHex = withoutPrefix.slice(colonIndex + 1);

  if (!ivHex || !ciphertextHex) {
    throw new Error(
      "decryptFlowBlob: malformed encrypted value — empty IV or ciphertext",
    );
  }

  const key = await getEncryptKey();
  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(ciphertextHex);

  let plainBuffer: ArrayBuffer;
  try {
    plainBuffer = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
  } catch {
    throw new Error(
      "decryptFlowBlob: decryption failed — the data may be corrupted or encrypted with a different key",
    );
  }

  const plaintext = new TextDecoder().decode(plainBuffer);
  return JSON.parse(plaintext);
}

/**
 * Transparently handles both encrypted and legacy plain-text flow blobs.
 *
 * - If `value` is a string starting with "enc:v1:" → decrypt and return.
 * - Otherwise → return `value` as-is (legacy plain text or already-parsed object).
 *
 * This allows the runner to serve existing unencrypted rows without a
 * one-off migration while all new writes are encrypted.
 */
export async function maybeDecryptFlowBlob(value: unknown): Promise<unknown> {
  if (typeof value === "string" && value.startsWith(ENCRYPTED_PREFIX)) {
    return decryptFlowBlob(value);
  }
  return value;
}
