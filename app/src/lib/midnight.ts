/**
 * CREDShield — Midnight.js Integration Layer
 *
 * This module bridges the frontend with the Midnight blockchain.
 * It uses @midnight-ntwrk/midnight-js-contracts and the wallet SDK
 * to deploy/interact with the credshield.compact contract.
 *
 * IMPORTANT: Private state and witness data are processed LOCALLY.
 * Only ZK proofs and non-sensitive ledger updates are broadcast on-chain.
 *
 * Architecture:
 *   Frontend → midnight.ts → Witness Provider → Compact Circuit → ZK Proof → Chain
 *
 * The witness provider supplies private inputs (credential attributes, issuer key)
 * to the circuit on the prover's machine. These inputs NEVER leave the local environment.
 */

import type {
  IssuerPrivateState,
  HolderPrivateState,
} from "./privateStateTypes";
import {
  fromHex,
  deriveCommitment,
  sha256,
  encodeString32,
  toHex,
} from "./crypto";
import type { CredentialType } from "@/types/credential";

// ──────────────────────────────────────────────────────────────────────────────
// Network Configuration
// ──────────────────────────────────────────────────────────────────────────────

export interface MidnightConfig {
  networkId: string;
  indexerUrl: string;
  proofServerUrl: string;
  nodeUrl: string;
}

export function getMidnightConfig(): MidnightConfig {
  return {
    networkId: process.env.NEXT_PUBLIC_NETWORK_ID || "undeployed",
    indexerUrl:
      process.env.NEXT_PUBLIC_INDEXER_URL ||
      "http://localhost:8088/api/v3/graphql",
    proofServerUrl:
      process.env.NEXT_PUBLIC_PROOF_SERVER_URL || "http://localhost:6300",
    nodeUrl:
      process.env.NEXT_PUBLIC_NODE_URL || "http://localhost:9944",
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Proof Simulation Layer
// (Used when the full Midnight node stack isn't available —
//  demonstrates correct ZK circuit logic without a live network)
// ──────────────────────────────────────────────────────────────────────────────

export interface SimulatedLedgerState {
  credential_commitment: string;  // hex
  issuer_commitment: string;      // hex
  credential_type: string;        // hex
  revocation_flag: number;
  expiry_year: number;
  verification_count: number;
  last_verified_at: number;
}

/**
 * Simulates issueCredential circuit locally.
 * Derives on-chain commitments from private inputs without exposing them.
 */
export async function simulateIssueCredential(
  issuerSecretKeyHex: string,
  credentialAttributesSecretHex: string,
  credType: CredentialType,
  expiryYear: number
): Promise<SimulatedLedgerState> {
  const issuerKey = fromHex(issuerSecretKeyHex);
  const attrsSecret = fromHex(credentialAttributesSecretHex);

  // mirrors: const issuer_hash = persistentHash<Bytes<32>>(issuer_secret)
  const issuerHash = await sha256(issuerKey);
  // mirrors: const cred_commitment = deriveCredentialCommitment(attrs, issuer_hash)
  const credCommitment = await deriveCommitment(attrsSecret, issuerHash);

  return {
    credential_commitment: toHex(credCommitment),
    issuer_commitment: toHex(issuerHash),
    credential_type: toHex(encodeString32(credType)),
    revocation_flag: 0,
    expiry_year: expiryYear,
    verification_count: 0,
    last_verified_at: 0,
  };
}

/**
 * Simulates verifyDegreeClaim circuit locally.
 */
export async function simulateVerifyDegreeClaim(
  ledger: SimulatedLedgerState,
  credentialAttributesSecretHex: string
): Promise<{ verified: boolean; updatedLedger: SimulatedLedgerState }> {
  if (ledger.revocation_flag !== 0) {
    return { verified: false, updatedLedger: ledger };
  }

  const attrsSecret = fromHex(credentialAttributesSecretHex);
  const issuerHash = fromHex(ledger.issuer_commitment);
  const recomputed = await deriveCommitment(attrsSecret, issuerHash);

  const verified = toHex(recomputed) === ledger.credential_commitment;

  if (!verified) {
    return { verified: false, updatedLedger: ledger };
  }

  return {
    verified: true,
    updatedLedger: {
      ...ledger,
      verification_count: ledger.verification_count + 1,
      last_verified_at: ledger.last_verified_at + 1,
    },
  };
}

/**
 * Simulates verifyGpaThreshold circuit locally.
 * The exact GPA is NEVER returned — only whether the threshold was met.
 */
export async function simulateVerifyGpaThreshold(
  ledger: SimulatedLedgerState,
  credentialAttributesSecretHex: string,
  gpaTimes10: number,
  thresholdTimes10: number
): Promise<{ verified: boolean; updatedLedger: SimulatedLedgerState }> {
  if (ledger.revocation_flag !== 0) {
    return { verified: false, updatedLedger: ledger };
  }

  // GPA threshold check (circuit assertion equivalent)
  if (gpaTimes10 < thresholdTimes10) {
    return { verified: false, updatedLedger: ledger };
  }

  // Verify credential commitment
  const attrsSecret = fromHex(credentialAttributesSecretHex);
  const issuerHash = fromHex(ledger.issuer_commitment);
  const recomputed = await deriveCommitment(attrsSecret, issuerHash);
  const verified = toHex(recomputed) === ledger.credential_commitment;

  if (!verified) return { verified: false, updatedLedger: ledger };

  return {
    verified: true,
    updatedLedger: { ...ledger, verification_count: ledger.verification_count + 1 },
  };
}

/**
 * Simulates revokeCredential circuit locally.
 */
export async function simulateRevokeCredential(
  ledger: SimulatedLedgerState,
  issuerSecretKeyHex: string
): Promise<{ success: boolean; updatedLedger: SimulatedLedgerState }> {
  const issuerKey = fromHex(issuerSecretKeyHex);
  const recomputedHash = await sha256(issuerKey);

  const isAuthorized = toHex(recomputedHash) === ledger.issuer_commitment;
  if (!isAuthorized) {
    return { success: false, updatedLedger: ledger };
  }

  return {
    success: true,
    updatedLedger: { ...ledger, revocation_flag: 1 },
  };
}
