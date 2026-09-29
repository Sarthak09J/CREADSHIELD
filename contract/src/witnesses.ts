/**
 * CREDShield Witness Provider
 *
 * Witnesses are the bridge between private state and the ZK circuit.
 * They supply private inputs to circuit computations ON THE PROVER'S MACHINE ONLY.
 * Witness values NEVER appear on-chain or in transaction broadcasts.
 *
 * Privacy guarantee:
 *   - issuerSecretKey  → used to derive issuer commitment, key itself stays local
 *   - credentialAttributes → used to derive credential commitment, never disclosed
 *   - gpaValue         → used only for threshold comparison, exact value hidden
 *   - graduationYear   → used for expiry check, compared privately
 */

import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

// ──────────────────────────────────────────────────────────────────────────────
// Private State Types
// ──────────────────────────────────────────────────────────────────────────────

/**
 * The issuer's private state — held locally by the issuer wallet only.
 * Never broadcast to the chain.
 */
export type IssuerPrivateState = {
  /** 32-byte secret key uniquely identifying this issuer */
  issuerSecretKey: Uint8Array;
};

/**
 * The holder's private state — held locally by the holder wallet only.
 * Never broadcast to the chain.
 * This is the "credential wallet" data.
 */
export type HolderPrivateState = {
  /** 32-byte secret derived from the full credential attributes */
  credentialAttributes: Uint8Array;
  /** GPA × 10 as an integer, e.g. 87 = 8.7 GPA */
  gpaValue: number;
  /** Graduation/expiry year */
  graduationYear: number;
};

/**
 * Union type for all private state variants in CREDShield
 */
export type CredShieldPrivateState = IssuerPrivateState | HolderPrivateState;

// ──────────────────────────────────────────────────────────────────────────────
// Type guards
// ──────────────────────────────────────────────────────────────────────────────

export function isIssuerState(state: CredShieldPrivateState): state is IssuerPrivateState {
  return "issuerSecretKey" in state;
}

export function isHolderState(state: CredShieldPrivateState): state is HolderPrivateState {
  return "credentialAttributes" in state;
}

// ──────────────────────────────────────────────────────────────────────────────
// Issuer Witness Provider
// Used when the issuer calls issueCredential() or revokeCredential()
// ──────────────────────────────────────────────────────────────────────────────

export const issuerWitnesses = {
  /**
   * Supplies the issuer's secret key to the circuit.
   * Returns [updatedPrivateState, witnessValue].
   * The circuit uses this to derive the issuer commitment.
   * The key itself is never written to the ledger.
   */
  getIssuerSecretKey: (
    context: WitnessContext<IssuerPrivateState>
  ): [IssuerPrivateState, Uint8Array] => {
    return [context.privateState, context.privateState.issuerSecretKey];
  },

  /**
   * Issuer does not provide credential attributes during issuance
   * (the holder generates them). This returns a zero buffer as placeholder.
   * In practice the issuer calls issueCredential with the holder-provided attributes hash.
   */
  getCredentialAttributes: (
    context: WitnessContext<IssuerPrivateState>
  ): [IssuerPrivateState, Uint8Array] => {
    // Placeholder — issuer should not call circuits that require holder attributes
    const placeholder = new Uint8Array(32);
    return [context.privateState, placeholder];
  },

  getGpaValue: (
    context: WitnessContext<IssuerPrivateState>
  ): [IssuerPrivateState, number] => {
    return [context.privateState, 0];
  },

  getGraduationYear: (
    context: WitnessContext<IssuerPrivateState>
  ): [IssuerPrivateState, number] => {
    return [context.privateState, 0];
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Holder Witness Provider
// Used when the holder calls verifyDegreeClaim(), verifyGpaThreshold(), etc.
// ──────────────────────────────────────────────────────────────────────────────

export const holderWitnesses = {
  /**
   * Holder does not possess the issuer's secret key — return placeholder.
   * The holder's credential is bound to the issuer commitment already on-chain.
   */
  getIssuerSecretKey: (
    context: WitnessContext<HolderPrivateState>
  ): [HolderPrivateState, Uint8Array] => {
    const placeholder = new Uint8Array(32);
    return [context.privateState, placeholder];
  },

  /**
   * Supplies the holder's credential attributes secret to the circuit.
   * This is the preimage of the credential commitment on-chain.
   * The circuit verifies the commitment matches without this value ever leaving
   * the local proving environment.
   */
  getCredentialAttributes: (
    context: WitnessContext<HolderPrivateState>
  ): [HolderPrivateState, Uint8Array] => {
    return [context.privateState, context.privateState.credentialAttributes];
  },

  /**
   * Supplies the holder's GPA (× 10) for threshold comparison.
   * The circuit asserts gpa >= threshold without disclosing the exact value.
   * e.g. 87 means GPA 8.7
   */
  getGpaValue: (
    context: WitnessContext<HolderPrivateState>
  ): [HolderPrivateState, number] => {
    return [context.privateState, context.privateState.gpaValue];
  },

  /**
   * Supplies the holder's graduation year for expiry verification.
   */
  getGraduationYear: (
    context: WitnessContext<HolderPrivateState>
  ): [HolderPrivateState, number] => {
    return [context.privateState, context.privateState.graduationYear];
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Factory: create a fresh holder private state from credential data
// This function runs locally on the holder's device — NEVER on-chain
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Creates a holder's private state from raw credential attributes.
 * The credentialSecret is derived by hashing all sensitive attributes together.
 * This means the holder can reproduce it deterministically from their credential data.
 *
 * IMPORTANT: The raw attributes (name, studentId, gpa, dob) are NOT stored here.
 * Only the derived commitment secret is kept. The raw data stays in the user's
 * credential wallet (localStorage / encrypted store) separately.
 */
export function createHolderPrivateState(
  credentialAttributesSecret: Uint8Array,
  gpaValue: number,
  graduationYear: number
): HolderPrivateState {
  return {
    credentialAttributes: credentialAttributesSecret,
    gpaValue,
    graduationYear,
  };
}

/**
 * Creates an issuer's private state from their secret key.
 */
export function createIssuerPrivateState(issuerSecretKey: Uint8Array): IssuerPrivateState {
  return { issuerSecretKey };
}
