/**
 * CREDShield Simulator Helpers
 *
 * Provides re-exports and helper types so tests can import from a single
 * location without depending on the compiled compact-runtime artifact.
 *
 * In a full Midnight project these would come from:
 *   import { Contract } from './managed/credshield/contract/index.cjs'
 *
 * For tests that run without the Compact compiler (e.g. in CI before
 * the toolchain is installed), we expose the types and pure logic here.
 */

export {
  issuerWitnesses,
  holderWitnesses,
  createHolderPrivateState,
  createIssuerPrivateState,
  isIssuerState,
  isHolderState,
} from "./witnesses.js";

export type {
  IssuerPrivateState,
  HolderPrivateState,
  CredShieldPrivateState,
} from "./witnesses.js";

// Placeholder Contract and Ledger types used by tests
// These are replaced by the real generated types when `compact compile` runs
export type Ledger = {
  credential_commitment: Uint8Array;
  issuer_commitment: Uint8Array;
  credential_type: Uint8Array;
  revocation_flag: number;
  expiry_year: number;
  verification_count: number;
  last_verified_at: number;
};

export type Contract = unknown;

export const pureCircuits = {};
