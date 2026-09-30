# CREDShield

> **Prove your credentials. Reveal nothing unnecessary.**

[![CI](https://github.com/Sarthak09J/CREADSHIELD/actions/workflows/ci.yml/badge.svg)](https://github.com/Sarthak09J/CREADSHIELD/actions/workflows/ci.yml)
[![Midnight](https://img.shields.io/badge/Powered%20by-Midnight-7c3aed)](https://midnight.network)
[![Tests](https://img.shields.io/badge/tests-7%20passing-brightgreen)](https://github.com/Sarthak09J/CREADSHIELD/actions)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

---

## 🔗 Links

| | |
|---|---|
| **GitHub Repository** | https://github.com/Sarthak09J/CREADSHIELD |
| **Live Demo** | https://creadshield.vercel.app |
| **CI/CD Workflow** | [.github/workflows/ci.yml](.github/workflows/ci.yml) |

---

## One-line pitch

Privacy-preserving credential verification dApp — prove a credential is valid without disclosing it.

---

## Product Proposal (Approved Idea)

**Idea from approved list:** Confidential Credentials

> *"Prove a credential is valid without disclosing it."*

CREDShield implements this idea as a fully functional dApp. A holder can prove:
- They hold a valid Bachelor's degree
- Their GPA meets a threshold (e.g. ≥ 8.0) — without revealing the exact GPA
- Their credential has not expired
- Their credential was issued by an approved institution

...all without revealing their name, student ID, date of birth, or any other sensitive data.

---

## Problem

Traditional credential verification forces users to share entire documents or all personal data, even when a verifier only needs a single claim.

A job applicant proving they hold a Bachelor's degree shouldn't have to expose:
- Student ID
- Exact GPA
- Date of birth
- Home address
- Full transcript

**The cost of over-disclosure:**
- Identity theft risk from unnecessary data exposure
- Regulatory violations (GDPR, FERPA) from over-collection
- Loss of individual privacy and control

---

## Solution

CREDShield uses Midnight's zero-knowledge proof system to let a holder prove specific claims about their credentials without revealing the underlying data.

```
Verifier asks:    "Does this person have a Bachelor's degree?"
Holder proves:    ✓ YES — cryptographic ZK proof
Verifier learns:  Only the answer — nothing else
```

---

## Privacy Model

### What an observer CAN learn (public on-chain data)

| Field | Value | Why public |
|---|---|---|
| `credential_commitment` | 32-byte opaque hash | Needed to verify proof |
| `issuer_commitment` | 32-byte opaque hash | Needed to verify issuer |
| `credential_type` | e.g. `BACHELORS_DEGREE` | Non-sensitive metadata |
| `revocation_flag` | 0 or 1 | Must be publicly checkable |
| `expiry_year` | e.g. 2027 | Used for expiry proofs |
| `verification_count` | integer | Non-sensitive counter |

### What an observer CANNOT learn

| Data | Why it's hidden |
|---|---|
| Holder's full name | Processed locally, never on-chain |
| Student ID | Processed locally, never on-chain |
| Exact GPA | Only threshold result is proven, not value |
| Date of birth | Processed locally, never on-chain |
| Credential attributes | Used only as witness input in ZK circuit |
| Issuer secret key | Used only to derive issuer commitment hash |
| Which circuit ran | ZK proof only reveals the result, not inputs |

### How privacy is enforced

1. **Compact `disclose()` annotation** — The compiler forces every value that crosses from private to public to be explicitly declared with `disclose()`. Accidental disclosure is a compile-time error.

2. **Witness functions** — Private inputs (`getCredentialAttributes`, `getIssuerSecretKey`, `getGpaValue`) are supplied by the prover locally. They appear only in the ZK circuit, never in the transaction broadcast.

3. **Commitment scheme** — `persistentHash(attrs || issuerHash)` is one-way. The on-chain commitment is mathematically bound to the private attributes but cannot be reversed to recover them.

4. **Threshold proofs** — `assert gpa_times_10 >= threshold` proves the GPA condition without ever disclosing the value. The exact GPA stays in private state.

---

## Why Midnight?

| Midnight Feature | How CREDShield uses it |
|---|---|
| **Private state** | Holds credential attributes locally — never on-chain |
| **Witnesses** | Supply private inputs to ZK circuits on the prover's machine |
| **Compact circuits** | Verify commitment equality and threshold assertions |
| **`disclose()`** | Explicitly gates what reaches the public ledger |
| **`persistentHash`** | One-way commitment derivation from private inputs |
| **Public ledger** | Stores only opaque commitments and non-sensitive metadata |

---

## Architecture

```
credshield/
├── contract/
│   ├── src/
│   │   ├── credshield.compact      # 6 ZK circuits
│   │   ├── witnesses.ts            # Private state + witness providers
│   │   └── test/
│   │       └── credshield.test.ts  # 7 automated tests
│   └── package.json
│
├── app/                            # Next.js 14 frontend
│   └── src/
│       ├── app/                    # 6 pages
│       ├── lib/midnight.ts         # Midnight integration layer
│       ├── lib/crypto.ts           # Local ZK commitment derivation
│       └── hooks/useWallet.ts      # Lace wallet connector
│
└── .github/workflows/ci.yml        # GitHub Actions CI/CD
```

---

## Smart Contract — 6 ZK Circuits

| Circuit | Private inputs | What it proves |
|---|---|---|
| `issueCredential` | issuer key, credential attrs | Derives commitments, writes non-sensitive metadata |
| `verifyDegreeClaim` | credential attrs | Holder knows attrs matching on-chain commitment |
| `verifyGpaThreshold` | GPA value, credential attrs | GPA ≥ threshold without revealing exact value |
| `verifyNotExpired` | credential attrs | Credential is within valid period |
| `verifyIssuer` | issuer key | Credential issued by expected issuer |
| `revokeCredential` | issuer key | Only issuer can revoke |

---

## User Flows

### 1. Issue a Credential (Issuer)
- Initialize issuer identity (generates local secret key)
- Fill credential form (name, degree, GPA, DOB — all marked 🔒 Private)
- ZK commitment computed locally from private attributes
- Only commitment hash written on-chain

### 2. Credential Wallet (Holder)
- View credential cards (private data shown only in holder's own session)
- See disclosure status: which fields are hidden
- Navigate to proof generation

### 3. Generate Proof (Holder)
- Select claims to prove (degree, GPA threshold, not expired)
- ZK proof generated locally on device
- Private data never leaves the session

### 4. Verify Credential (Verifier)
- Commitment fields auto-filled from credential wallet
- Select only the claims needed
- Verify → see claim results with privacy summary
- Personal data is never disclosed to verifier

---

## ZK Proof Flow

```
1. Holder loads private credential attributes (local storage)
        ↓
2. Witness provides attributes to Compact circuit
        ↓
3. Circuit: recomputedCommitment = H(attrs || issuerHash)
        ↓
4. Circuit: assert recomputedCommitment == on-chain commitment
        ↓
5. ZK proof generated locally — attrs never leave device
        ↓
6. Verifier receives: claim result only (✓ or ✕)
        ↓
7. Verifier does NOT receive: name, ID, GPA, DOB, full credential
```

---

## Tests — 7 Passing

```bash
cd contract && npm run test
```

| # | Test | What it verifies |
|---|---|---|
| 1 | Valid credential proof accepted | Core ZK circuit logic |
| 2 | Tampered credential rejected | Commitment mismatch detection |
| 3 | Revoked credential cannot verify | Revocation flag enforcement |
| 4 | Unauthorized party cannot revoke | Issuer key authorization |
| 5 | GPA threshold passes (8.7 ≥ 8.0) | Threshold proof correctness |
| 6 | GPA threshold fails (8.7 < 9.5) | Threshold rejection |
| 7 | Private attributes NOT in ledger | Privacy isolation guarantee |

---

## CI/CD

GitHub Actions: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

**4 jobs run on every push:**
1. `contract-tests` — installs deps, runs 7 tests, typechecks
2. `app-build` — typechecks Next.js app, runs production build
3. `compact-compile` — installs Compact toolchain, compiles contract
4. `security` — checks for accidentally committed secrets

---

## Local Development

```bash
# Install dependencies
npm install

# Run tests (7 passing)
cd contract && npm run test

# Start the app
cd app && npm run dev
# Open http://localhost:3000
```

---

## Environment Variables

Copy `.env.example` to `.env.local`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_NETWORK_ID` | `preprod` / `mainnet` / `undeployed` |
| `NEXT_PUBLIC_INDEXER_URL` | Midnight indexer GraphQL endpoint |
| `NEXT_PUBLIC_PROOF_SERVER_URL` | Proof server URL |
| `NEXT_PUBLIC_NODE_URL` | Midnight node RPC URL |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed contract address |

---

## Security Considerations

- No secrets are hardcoded anywhere
- Private credential attributes never written to blockchain
- `disclose()` enforced at compile time by Compact compiler
- Witness inputs processed only on prover's machine
- `.env` files are gitignored
- No sensitive values in error messages or logs

---

## Limitations

- Full on-chain deployment requires Midnight node + indexer + proof server (Docker)
- Lace wallet requires Midnight network to be enabled in extension settings
- ZK proof generation for advanced circuits requires the Compact toolchain installed

---

## Future Improvements

- Multi-claim selective disclosure in one proof
- On-chain revocation registry with Merkle tree
- W3C Verifiable Credentials format compatibility
- Mobile wallet support
- Credential delegation

---

## Hackathon Submission Checklist

| Requirement | Status |
|---|---|
| ✅ Public GitHub repository | https://github.com/Sarthak09J/CREADSHIELD |
| ✅ Complete README | This document |
| ✅ Live demo | https://creadshield.vercel.app |
| ✅ Approved idea: Confidential Credentials | See Product Proposal section |
| ✅ Fully functional dApp | 6 pages, complete user flows |
| ✅ Meaningful Midnight privacy model | Witnesses, disclose(), ZK circuits |
| ✅ 3+ tests passing | 7 tests passing |
| ✅ CI/CD workflow file | `.github/workflows/ci.yml` |
| ✅ 10+ meaningful commits | 19 commits |
| ✅ Privacy model documented | See Privacy Model section |
| ✅ No hardcoded secrets | .env.example provided |
| ✅ Responsive UI | Tailwind CSS responsive design |
| ✅ Loading/error/success states | All operations have 3 states |

---

## License

Apache 2.0

---

*Built for the Midnight Hackathon · Confidential Credentials track*
*Powered by Midnight zero-knowledge proofs*

This the screenshot of 3+ tests passed
<img width="1870" height="987" alt="image" src="https://github.com/user-attachments/assets/2c4f63fb-85f5-43f4-aaa7-53d7bdc3c034" />













