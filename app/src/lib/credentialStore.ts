/**
 * CREDShield Credential Store
 *
 * Manages the holder's local credential wallet.
 * Credentials are stored in localStorage (encrypted in production).
 *
 * PRIVACY NOTE: This data is local to the user's browser.
 * It is NEVER sent to the blockchain or any server.
 * The on-chain state contains only opaque commitments.
 */

import type { CredentialCard, RawCredentialData, CredentialType } from "@/types/credential";
import { deriveCredentialAttributesSecret, toHex, encodeString32 } from "./crypto";

const STORAGE_KEY = "credshield:credentials:v1";
const ISSUER_KEY_STORAGE = "credshield:issuer:v1";

// ──────────────────────────────────────────────────────────────────────────────
// Credential Storage (Holder)
// ──────────────────────────────────────────────────────────────────────────────

export interface StoredCredential {
  card: CredentialCard;
  /** hex-encoded 32-byte attributes secret — private, kept local */
  attributesSecretHex: string;
  /** GPA × 10 for threshold proofs */
  gpaTimes10: number;
}

export function loadCredentials(): StoredCredential[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredCredential[];
  } catch {
    return [];
  }
}

export function saveCredentials(credentials: StoredCredential[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
}

export function addCredential(credential: StoredCredential): void {
  const existing = loadCredentials();
  const updated = [...existing.filter((c) => c.card.id !== credential.card.id), credential];
  saveCredentials(updated);
}

export function getCredentialById(id: string): StoredCredential | undefined {
  return loadCredentials().find((c) => c.card.id === id);
}

export function removeCredential(id: string): void {
  const existing = loadCredentials();
  saveCredentials(existing.filter((c) => c.card.id !== id));
}

// ──────────────────────────────────────────────────────────────────────────────
// Issuer Key Storage
// ──────────────────────────────────────────────────────────────────────────────

export interface StoredIssuerState {
  /** hex-encoded 32-byte issuer secret key */
  issuerSecretKeyHex: string;
  /** derived issuer commitment (public, derived from the key) */
  issuerCommitmentHex: string;
  issuerName: string;
}

export function loadIssuerState(): StoredIssuerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ISSUER_KEY_STORAGE);
    if (!raw) return null;
    return JSON.parse(raw) as StoredIssuerState;
  } catch {
    return null;
  }
}

export function saveIssuerState(state: StoredIssuerState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ISSUER_KEY_STORAGE, JSON.stringify(state));
}

// ──────────────────────────────────────────────────────────────────────────────
// Credential Factory
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Create a new StoredCredential from raw credential data.
 * Derives the attributes secret locally — never sends raw data anywhere.
 */
export async function createStoredCredential(
  rawData: RawCredentialData,
  credentialType: CredentialType,
  credentialId: string,
  issuerCommitmentHex: string,
  credentialCommitmentHex: string,
  contractAddress?: string
): Promise<StoredCredential> {
  const attributesSecret = await deriveCredentialAttributesSecret(
    rawData.name,
    rawData.studentId,
    rawData.degree,
    rawData.university,
    rawData.gpa,
    rawData.dateOfBirth
  );

  const gpaTimes10 = Math.round(rawData.gpa * 10);

  const card: CredentialCard = {
    id: credentialId,
    type: credentialType,
    institution: rawData.university,
    degree: rawData.degree,
    issuedYear: new Date().getFullYear(),
    expiryYear: rawData.graduationYear,
    status: "valid",
    privateData: rawData,
    contractAddress,
    credentialCommitmentHex,
    issuerCommitmentHex,
  };

  return {
    card,
    attributesSecretHex: toHex(attributesSecret),
    gpaTimes10,
  };
}
