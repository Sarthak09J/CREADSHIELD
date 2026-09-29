/**
 * CREDShield — Application Types
 *
 * These types represent the frontend data model.
 * IMPORTANT: Sensitive fields (name, studentId, gpa, dob) exist only in the
 * holder's local credential wallet. They are NEVER sent to the blockchain.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Credential Types
// ──────────────────────────────────────────────────────────────────────────────

export type CredentialType =
  | "BACHELORS_DEGREE"
  | "MASTERS_DEGREE"
  | "PHD"
  | "DIPLOMA"
  | "CERTIFICATION"
  | "EMPLOYMENT"
  | "ENROLLMENT";

export type CredentialStatus = "valid" | "revoked" | "expired" | "pending";

/**
 * The raw credential data — stored ONLY in the holder's local wallet.
 * This data NEVER goes on-chain.
 */
export interface RawCredentialData {
  name: string;          // 🔒 Private
  studentId: string;     // 🔒 Private
  degree: string;        // 🔒 Private
  university: string;    // Non-sensitive (but kept private by default)
  graduationYear: number;
  gpa: number;           // 🔒 Private
  dateOfBirth: string;   // 🔒 Private
}

/**
 * A credential card — safe to display in the holder's own UI.
 * The sensitive fields are shown only to the holder in their own session.
 * They are read from localStorage / private state, NOT from the blockchain.
 */
export interface CredentialCard {
  id: string;                    // Non-sensitive identifier
  type: CredentialType;
  institution: string;           // Publicly visible (holder chose to display)
  degree: string;                // Holder's own view
  issuedYear: number;
  expiryYear: number;
  status: CredentialStatus;
  // These are only populated in the holder's OWN view:
  privateData?: RawCredentialData;
  // On-chain references (non-sensitive):
  contractAddress?: string;
  credentialCommitmentHex?: string; // commitment hash (public but opaque)
  issuerCommitmentHex?: string;     // issuer hash (public but opaque)
}

// ──────────────────────────────────────────────────────────────────────────────
// Proof Request Types
// ──────────────────────────────────────────────────────────────────────────────

export type ClaimType =
  | "HAS_DEGREE"
  | "GPA_THRESHOLD"
  | "NOT_EXPIRED"
  | "VALID_ISSUER"
  | "IS_ENROLLED";

export interface ClaimRequest {
  type: ClaimType;
  /** For GPA_THRESHOLD: the minimum GPA (e.g. 8.0) */
  gpaThreshold?: number;
  /** For VALID_ISSUER: the expected issuer commitment hex */
  expectedIssuerCommitment?: string;
  /** For NOT_EXPIRED: the current year to check against */
  currentYear?: number;
}

export interface ProofRequest {
  id: string;
  verifierName: string;
  verifierOrg: string;
  credentialType: CredentialType;
  claims: ClaimRequest[];
  createdAt: number;
  expiresAt?: number;
  status: "pending" | "fulfilled" | "rejected" | "expired";
}

// ──────────────────────────────────────────────────────────────────────────────
// Proof Result Types
// ──────────────────────────────────────────────────────────────────────────────

export interface ClaimVerificationResult {
  claim: ClaimType;
  verified: boolean;
  /** Any non-sensitive metadata about the result */
  metadata?: Record<string, string | number | boolean>;
}

export interface ProofResult {
  requestId: string;
  credentialId: string;
  claims: ClaimVerificationResult[];
  overallVerified: boolean;
  /** Transaction hash on Midnight (public) */
  transactionHash?: string;
  verifiedAt: number;
  /** Explicitly lists what was and was NOT disclosed */
  disclosure: {
    disclosed: string[];   // e.g. ["credential_type", "verification_result"]
    hidden: string[];      // e.g. ["name", "student_id", "gpa", "dob"]
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Wallet Types
// ──────────────────────────────────────────────────────────────────────────────

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

export interface WalletState {
  status: WalletStatus;
  address?: string;
  networkId?: string;
  balance?: {
    dust: string;
    night: string;
  };
  error?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// UI State Types
// ──────────────────────────────────────────────────────────────────────────────

export type OperationStatus = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  status: OperationStatus;
  data?: T;
  error?: string;
}
