/**
 * Private state types for the app layer.
 * These mirror the types in the contract package without depending on it at runtime.
 */

export interface IssuerPrivateState {
  issuerSecretKey: Uint8Array;
}

export interface HolderPrivateState {
  credentialAttributes: Uint8Array;
  gpaValue: number;
  graduationYear: number;
}
