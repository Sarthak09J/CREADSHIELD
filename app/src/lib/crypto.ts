/**
 * CREDShield Client-side Crypto Utilities
 *
 * These utilities run entirely on the holder's machine.
 * They derive private state from credential data — used as inputs to ZK witnesses.
 * NEVER expose the outputs of these functions publicly.
 */

/**
 * Derive a 32-byte credential attributes secret from raw credential data.
 * This deterministic derivation means the holder can recreate their private
 * state from their raw credential data at any time.
 *
 * The derived secret is the preimage of the on-chain credential commitment.
 */
export async function deriveCredentialAttributesSecret(
  name: string,
  studentId: string,
  degree: string,
  university: string,
  gpa: number,
  dateOfBirth: string
): Promise<Uint8Array> {
  const combined = `${name}|${studentId}|${degree}|${university}|${gpa}|${dateOfBirth}|credshield-v1`;
  const encoded = new TextEncoder().encode(combined);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(hashBuffer);
}

/**
 * Encode a short string into a padded 32-byte array (for credential_type ledger field)
 */
export function encodeString32(s: string): Uint8Array {
  const buf = new Uint8Array(32);
  const encoded = new TextEncoder().encode(s.slice(0, 32));
  buf.set(encoded);
  return buf;
}

/**
 * Convert a Uint8Array to a hex string (for display purposes only)
 */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert a hex string back to Uint8Array
 */
export function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Truncate a hex string for display (e.g. commitment hash preview)
 * Shows first 8 + last 8 chars
 */
export function truncateHex(hex: string, chars = 8): string {
  if (hex.length <= chars * 2 + 3) return hex;
  return `${hex.slice(0, chars)}...${hex.slice(-chars)}`;
}

/**
 * Generate a random 32-byte secret (used for issuer key generation in demo mode)
 * NEVER store this in plaintext — use encrypted storage in production
 */
export function generateRandomSecret(): Uint8Array {
  const secret = new Uint8Array(32);
  crypto.getRandomValues(secret);
  return secret;
}

/**
 * Derive the SHA-256 hash of a value (mirrors persistentHash<Bytes<32>>() in Compact)
 */
export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
  return new Uint8Array(hashBuffer);
}

/**
 * Derive commitment from two 32-byte values (mirrors persistentHash<Vector<2,Bytes<32>>>)
 */
export async function deriveCommitment(a: Uint8Array, b: Uint8Array): Promise<Uint8Array> {
  const combined = new Uint8Array(64);
  combined.set(a, 0);
  combined.set(b, 32);
  return sha256(combined);
}
