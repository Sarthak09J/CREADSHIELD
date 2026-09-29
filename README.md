# CREDShield

> **Prove your credentials. Reveal nothing unnecessary.**

[![CI](https://github.com/your-username/credshield/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/credshield/actions/workflows/ci.yml)
[![Midnight](https://img.shields.io/badge/Powered%20by-Midnight-7c3aed)](https://midnight.network)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

---

## One-line pitch

Privacy-preserving credential verification dApp — prove a credential is valid without disclosing it.

---

## Problem

Traditional credential verification forces users to share entire documents or all personal data, even when a verifier only needs a single claim. A job applicant proving they hold a Bachelor's degree shouldn't have to expose their student ID, exact GPA, date of birth, and home address.

**The cost of over-disclosure:**
- Identity theft risk from unnecessary data exposure
- Regulatory violations (GDPR, FERPA) from over-collection
- Loss of individual privacy and control

---

## Solution

CREDShield uses Midnight's zero-knowledge proof system to let a holder prove specific claims about their credentials without revealing the underlying data.

```
Verifier asks:    "Does this person have a Bachelor's degree?"
Holder proves:    ✓ YES — cryptographic proof
Verifier learns:  Only the answer — nothing else
```

The holder's name, student ID, exact GPA, date of birth, and full credential details remain private.

---

## Why Confidential Credentials?

This is the approved hackathon idea: **"Confidential Credentials — prove a credential is valid without disclosing it."**

CREDShield implements this idea fundamentally — privacy is not an add-on feature but the core purpose:

- Sensitive credential attributes never appear on-chain
- ZK proofs prove claims about private data without revealing it
- Selective disclosure: verifiers receive only what they request
- The contract enforces privacy at the circuit level

---

## Why Midnight?

Midnight's privacy model is uniquely suited to this use case:

| Feature | How CREDShield uses it |
|---|---|
| **Private state** | Holds credential attributes (name, GPA, DOB) locally — never on-chain |
| **Witnesses** | Supply private inputs (attributes secret, issuer key) to ZK circuits |
| **Compact circuits** | Verify commitment equality and threshold assertions |
| **`disclose()`** | Explicitly and deliberately gates what reaches the public ledger |
| **`persistentHash`** | One-way commitment derivation from private inputs |
| **Public ledger** | Stores only opaque commitments and non-sensitive metadata |

---

## How Privacy Works

```
User inputs (name, GPA, DOB, ...)
          ↓
  Local: deriveCredentialAttributesSecret()
          ↓
  Private state (HolderPrivateState)
          ↓
  Witness → getCredentialAttributes()
          ↓
  Compact circuit: deriveCredentialCommitment(attrs, issuerHash)
          ↓
  ZK proof: "I know attrs such that H(attrs, issuerHash) == commitment"
          ↓
  Midnight transaction (proof only)
          ↓
  On-chain: commitment ✓ (attrs never revealed)
```

The ZK proof convinces the verifier that the holder knows the private attributes matching the on-chain commitment — without revealing those attributes.

---

## Public vs Private Data

### Public (on-chain, visible to anyone)

| Field | Why it's public |
|---|---|
| `credential_commitment` | Opaque hash — needed for proof verification |
| `issuer_commitment` | Opaque hash — needed to verify issuer identity |
| `credential_type` | e.g. `BACHELORS_DEGREE` — non-sensitive metadata |
| `revocation_flag` | Must be publicly checkable for validity |
| `expiry_year` | Used for expiry proofs |
| `verification_count` | Non-sensitive counter |

### Private (local only, never on-chain)

| Data | Who holds it |
|---|---|
| Full name | Holder local storage |
| Student ID | Holder local storage |
| Exact GPA | Holder local storage |
| Date of birth | Holder local storage |
| Credential attributes secret | Holder private state |
| Issuer secret key | Issuer local storage |
| Witness inputs | Prover machine only |

---

## Architecture

```
credshield/
├── contract/                    # Midnight Compact contract
│   ├── src/
│   │   ├── credshield.compact   # Main ZK contract (6 circuits)
│   │   ├── witnesses.ts         # Witness providers (private state)
│   │   ├── simulator-helpers.ts # Test re-exports
│   │   ├── index.ts             # Barrel export
│   │   └── test/
│   │       └── credshield.test.ts  # 7 automated tests
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── app/                         # Next.js frontend
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── dashboard/       # User dashboard
│   │   │   ├── credentials/     # Holder credential wallet
│   │   │   ├── issuer/          # Issuer dashboard
│   │   │   ├── verifier/        # Verifier dashboard
│   │   │   └── proof/[id]/      # Proof generation
│   │   ├── components/ui/       # Reusable UI components
│   │   ├── hooks/               # React hooks
│   │   ├── lib/                 # Midnight integration, crypto, store
│   │   └── types/               # TypeScript types
│   ├── package.json
│   └── next.config.js
│
├── .github/workflows/ci.yml     # GitHub Actions CI/CD
├── .env.example                 # Environment template
└── README.md
```

---

## Smart Contract Design

The contract (`contract/src/credshield.compact`) implements 6 ZK circuits:

### 1. `issueCredential(credType, expiryYear)`
- **Witnesses**: `getIssuerSecretKey()`, `getCredentialAttributes()`
- **Computes**: issuer commitment, credential commitment
- **Writes to ledger**: commitments + non-sensitive metadata only
- **Private**: issuer key, credential attributes

### 2. `verifyDegreeClaim()`
- **Witnesses**: `getCredentialAttributes()`
- **Asserts**: commitment recomputed from private attrs == on-chain commitment
- **Proves**: holder knows valid attributes without revealing them

### 3. `verifyGpaThreshold(thresholdTimes10)`
- **Witnesses**: `getGpaValue()`, `getCredentialAttributes()`
- **Asserts**: `gpa_times_10 >= threshold_times_10`
- **Proves**: GPA meets threshold without revealing exact value

### 4. `verifyNotExpired(currentYear)`
- **Witnesses**: `getCredentialAttributes()`
- **Asserts**: `expiry_year >= currentYear` and commitment valid

### 5. `verifyIssuer(expectedIssuerCommitment)`
- **Witnesses**: `getIssuerSecretKey()`
- **Asserts**: issuer key hash == expected commitment

### 6. `revokeCredential()`
- **Witnesses**: `getIssuerSecretKey()`
- **Asserts**: caller is the issuer
- **Writes**: `revocation_flag = 1`

---

## ZK Proof Flow

```
1. Holder has credential (locally stored)
2. Verifier sends proof request: "Prove HAS_DEGREE"
3. Holder's device:
   a. Loads private state: HolderPrivateState { credentialAttributes, gpaValue }
   b. Witness provides attrs to Compact circuit
   c. Circuit: recomputedCommitment = H(attrs || issuerHash)
   d. Circuit: assert recomputedCommitment == credential_commitment (on-chain)
   e. ZK proof generated locally
4. Proof submitted to Midnight
5. Chain verifies proof without seeing attrs
6. Verifier sees: credential_type ✓, NOT_REVOKED ✓
7. Verifier does NOT see: name, studentId, gpa, dob, full credential
```

---

## Wallet Integration

CREDShield connects to the **Midnight DApp Connector** (Lace wallet extension).

When `window.midnight` is detected, the app uses the real wallet connector.
Otherwise it falls back to demo mode for local development.

```typescript
const connector = (window as any).midnight;
if (connector) {
  // Real Lace wallet integration
} else {
  // Demo mode: simulated wallet
}
```

---

## Local Development

### Prerequisites

- Node.js >= 22
- npm >= 10
- Compact devtools (optional — for contract compilation)

### Install dependencies

```bash
npm install
```

### Start the frontend

```bash
cd app
npm run dev
```

Open http://localhost:3000

### Run tests

```bash
cd contract
npm run test
```

### Compile the Compact contract (requires toolchain)

```bash
# Install Compact devtools
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh

# Install specific toolchain version
compact update 0.31.1

# Compile
cd contract
npm run compact
```

---

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_NETWORK_ID` | `undeployed` / `preprod` |
| `NEXT_PUBLIC_INDEXER_URL` | Midnight indexer GraphQL endpoint |
| `NEXT_PUBLIC_PROOF_SERVER_URL` | Proof server URL |
| `NEXT_PUBLIC_NODE_URL` | Midnight node RPC URL |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed contract address |

---

## Testing

**7 automated tests** covering the core ZK circuit logic:

```bash
cd contract && npm run test
```

| Test | What it verifies |
|---|---|
| TEST 1 | Valid credential proof is accepted |
| TEST 2 | Tampered credential proof is rejected |
| TEST 3 | Revoked credential cannot be verified |
| TEST 4 | Unauthorized party cannot revoke a credential |
| TEST 5 | GPA threshold proof succeeds (8.7 >= 8.0) |
| TEST 6 | GPA threshold proof fails (8.7 < 9.5) |
| TEST 7 | Private attributes NOT in public ledger state |

Tests use the **Vitest** framework and run against a TypeScript simulation of the Compact circuit logic — no blockchain or proof server needed.

---

## CI/CD

GitHub Actions workflow: `.github/workflows/ci.yml`

**Jobs:**

1. **contract-tests** — installs deps, runs 7 tests, typechecks contract
2. **app-build** — typechecks app, builds Next.js production bundle
3. **compact-compile** — installs Compact toolchain, compiles contract
4. **security** — checks for accidentally committed secrets

---

## Deployment

### Testnet (Preprod)

1. Start a local proof server:
   ```bash
   docker compose -f proof-server.yml up
   ```

2. Set environment variables for preprod in `.env.local`

3. Deploy the contract using the Midnight DApp Connector + Lace wallet

4. Set `NEXT_PUBLIC_CONTRACT_ADDRESS` to the deployed address

### Local Standalone

Use Docker Compose with the Midnight standalone stack:
```bash
# node + indexer + proof server all local
docker compose -f standalone.yml up
```

---

## Security Considerations

- **No secrets on-chain**: Credential attributes are never written to the ledger
- **One-way commitments**: `persistentHash` is preimage-resistant — commitments cannot be reversed
- **Explicit disclosure**: Compact's `disclose()` forces every public disclosure to be deliberate
- **Local proving**: ZK proofs are generated on the holder's device, not on a server
- **No logging of private data**: Private state values are not logged or exported
- **No hardcoded keys**: All secrets use environment variables or local storage

---

## Limitations

- **Demo mode**: Without the full Midnight node stack (node + indexer + proof server), the app runs in simulation mode where the ZK circuit logic is executed in TypeScript rather than through the actual Compact runtime
- **Wallet**: Full Lace wallet integration requires the browser extension to be installed
- **Proof server**: GPA threshold and advanced proofs require a running Midnight proof server for actual ZK proof generation

---

## Future Improvements

- Multi-claim selective disclosure in a single proof
- Credential delegation (holder delegates proof authority)
- On-chain revocation registry with Merkle tree
- Verifiable presentation format compatible with W3C VCs
- Mobile wallet support
- Encrypted credential backup with viewing keys

---

## Hackathon Requirements Checklist

| Requirement | Status |
|---|---|
| ✅ Approved idea: Confidential Credentials | **DONE** |
| ✅ Fully functional dApp | **DONE** |
| ✅ Real Midnight Compact contract | **DONE** — `contract/src/credshield.compact` |
| ✅ Meaningful Midnight privacy model | **DONE** — witnesses, disclose(), commitments |
| ✅ ZK proof is part of application logic | **DONE** — verifyDegreeClaim, verifyGpaThreshold |
| ✅ Sensitive credential data protected | **DONE** — never on-chain |
| ✅ Credential issuance flow | **DONE** — Issuer Dashboard |
| ✅ Holder credential wallet | **DONE** — My Credentials |
| ✅ Verifier proof request | **DONE** — Verifier Dashboard |
| ✅ Proof generation | **DONE** — Proof page |
| ✅ Verification result | **DONE** — with privacy disclosure summary |
| ✅ Invalid proof rejected | **DONE** — TEST 2, TEST 3 |
| ✅ 3+ meaningful tests | **DONE** — 7 tests |
| ✅ Build passes | **DONE** |
| ✅ CI/CD workflow | **DONE** — `.github/workflows/ci.yml` |
| ✅ No hardcoded secrets | **DONE** |
| ✅ README complete | **DONE** |
| ✅ UI responsive | **DONE** |
| ✅ Loading/error/success states | **DONE** |
| ✅ 10+ meaningful commits | **DONE** |

---

## License

Apache 2.0 — see [LICENSE](LICENSE)

---

*Built for the Midnight Hackathon · Confidential Credentials track*
*Powered by Midnight zero-knowledge proofs*
