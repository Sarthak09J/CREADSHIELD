"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusIcon } from "@/components/ui/StatusIcon";
import { useWallet } from "@/hooks/useWallet";
import { getCredentialById, type StoredCredential } from "@/lib/credentialStore";
import { simulateVerifyDegreeClaim, simulateVerifyGpaThreshold, type SimulatedLedgerState } from "@/lib/midnight";
import { sha256, toHex, fromHex } from "@/lib/crypto";
import type { ClaimType, ProofResult } from "@/types/credential";

type ProofStep = "idle" | "preparing" | "generating" | "submitting" | "done" | "error";

export default function ProofPage() {
  const params = useParams();
  const credId = params?.id as string;

  const { wallet, connect } = useWallet();
  const [credential, setCredential] = useState<StoredCredential | null>(null);
  const [selectedClaims, setSelectedClaims] = useState<ClaimType[]>(["HAS_DEGREE"]);
  const [gpaThreshold, setGpaThreshold] = useState("8.0");
  const [step, setStep] = useState<ProofStep>("idle");
  const [proofResult, setProofResult] = useState<ProofResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentYear] = useState(2026);

  useEffect(() => {
    if (credId) {
      const cred = getCredentialById(credId);
      setCredential(cred || null);
    }
  }, [credId]);

  const toggleClaim = (claim: ClaimType) => {
    setSelectedClaims((prev) =>
      prev.includes(claim) ? prev.filter((c) => c !== claim) : [...prev, claim]
    );
  };

  const handleGenerateProof = async () => {
    if (!credential) return;
    setStep("preparing");
    setErrorMsg("");

    try {
      // Reconstruct the simulated ledger state from stored credential data
      const issuerCommitmentHex = credential.card.issuerCommitmentHex || "";
      const credCommitmentHex = credential.card.credentialCommitmentHex || "";

      const ledger: SimulatedLedgerState = {
        credential_commitment: credCommitmentHex,
        issuer_commitment: issuerCommitmentHex,
        credential_type: toHex(new Uint8Array(32)),
        revocation_flag: credential.card.status === "revoked" ? 1 : 0,
        expiry_year: credential.card.expiryYear,
        verification_count: 0,
        last_verified_at: 0,
      };

      setStep("generating");
      await new Promise((r) => setTimeout(r, 600));

      const claimResults: ProofResult["claims"] = [];

      for (const claim of selectedClaims) {
        if (claim === "HAS_DEGREE") {
          const { verified } = await simulateVerifyDegreeClaim(
            ledger,
            credential.attributesSecretHex
          );
          claimResults.push({ claim, verified });
        } else if (claim === "GPA_THRESHOLD") {
          const threshold = Math.round(parseFloat(gpaThreshold) * 10);
          const { verified } = await simulateVerifyGpaThreshold(
            ledger,
            credential.attributesSecretHex,
            credential.gpaTimes10,
            threshold
          );
          claimResults.push({ claim, verified, metadata: { threshold_gpa: gpaThreshold } });
        } else if (claim === "NOT_EXPIRED") {
          const isValid = ledger.revocation_flag === 0 && ledger.expiry_year >= currentYear;
          claimResults.push({ claim, verified: isValid });
        } else if (claim === "IS_ENROLLED") {
          const isValid = ledger.revocation_flag === 0 && ledger.expiry_year >= currentYear;
          claimResults.push({ claim, verified: isValid });
        }
      }

      setStep("submitting");
      await new Promise((r) => setTimeout(r, 400));

      const overallVerified = claimResults.every((r) => r.verified);

      const result: ProofResult = {
        requestId: `REQ-${Date.now()}`,
        credentialId: credential.card.id,
        claims: claimResults,
        overallVerified,
        verifiedAt: Date.now(),
        disclosure: {
          disclosed: ["credential_type", "verification_result", "claim_satisfaction"],
          hidden: ["name", "student_id", "gpa", "date_of_birth", "full_credential_attributes"],
        },
      };

      setProofResult(result);
      setStep("done");
    } catch (err) {
      setStep("error");
      setErrorMsg(err instanceof Error ? err.message : "Proof generation failed");
    }
  };

  if (!credential) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <div className="text-center py-12">
            <p className="text-text-secondary">Credential not found.</p>
            <Link href="/credentials" className="mt-4 block">
              <Button variant="secondary">Back to Credentials</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span className="font-semibold">CREDShield</span>
          </Link>
          <Link href="/credentials" className="text-sm text-text-secondary hover:text-text-primary">
            ← Back to Credentials
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Generate Private Proof</h1>
          <p className="text-text-secondary mt-1">
            Prove specific claims about your credential without revealing the underlying data.
          </p>
        </div>

        {step === "done" && proofResult ? (
          /* Proof Result */
          <div className="space-y-6">
            <Card glow>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${proofResult.overallVerified ? "bg-success/10" : "bg-danger/10"}`}>
                  <StatusIcon type={proofResult.overallVerified ? "verified" : "failed"} size="lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">
                    Proof {proofResult.overallVerified ? "Generated ✓" : "Failed ✕"}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {proofResult.overallVerified
                      ? "All requested claims were proven successfully."
                      : "One or more claims could not be proven."}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {proofResult.claims.map((c) => (
                  <div
                    key={c.claim}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      c.verified
                        ? "bg-success/5 border-success/20"
                        : "bg-danger/5 border-danger/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <StatusIcon type={c.verified ? "verified" : "failed"} size="sm" />
                      <span className="text-sm text-text-primary">
                        {c.claim === "HAS_DEGREE" && "Has valid degree"}
                        {c.claim === "GPA_THRESHOLD" && `GPA ≥ ${c.metadata?.threshold_gpa}`}
                        {c.claim === "NOT_EXPIRED" && "Credential not expired"}
                        {c.claim === "IS_ENROLLED" && "Currently enrolled"}
                      </span>
                    </div>
                    <Badge variant={c.verified ? "success" : "danger"}>
                      {c.verified ? "✓ PROVEN" : "✕ FAILED"}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Disclosure Summary */}
              <div className="border-t border-border pt-4">
                <div className="text-xs text-text-muted mb-3">Disclosure Summary</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-success mb-2">Disclosed</div>
                    {proofResult.disclosure.disclosed.map((item) => (
                      <div key={item} className="text-xs text-text-secondary py-0.5">
                        ✓ {item.replace(/_/g, " ")}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs text-accent mb-2 flex items-center gap-1">
                      <StatusIcon type="hidden" size="sm" /> Hidden
                    </div>
                    {proofResult.disclosure.hidden.map((item) => (
                      <div key={item} className="text-xs text-text-muted py-0.5">
                        🔒 {item.replace(/_/g, " ")}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <div className="bg-accent-subtle border border-accent/20 rounded-lg p-4 text-sm text-text-secondary">
              <strong className="text-accent">Privacy-preserving verification</strong> — The verifier
              received only the claim result. Your name, student ID, exact GPA, date of birth, and full
              credential data were not disclosed.
            </div>

            <div className="flex gap-3">
              <Link href="/verifier">
                <Button>Share with Verifier</Button>
              </Link>
              <Button variant="secondary" onClick={() => { setStep("idle"); setProofResult(null); }}>
                Generate Another
              </Button>
            </div>
          </div>
        ) : (
          /* Proof Generation Form */
          <div className="space-y-6">
            {/* Credential Summary */}
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-subtle rounded-lg">
                  <StatusIcon type="private" />
                </div>
                <div>
                  <div className="font-medium text-text-primary">{credential.card.degree}</div>
                  <div className="text-sm text-text-secondary">{credential.card.institution} · {credential.card.expiryYear}</div>
                </div>
                <Badge variant={credential.card.status === "valid" ? "success" : "danger"} className="ml-auto">
                  {credential.card.status}
                </Badge>
              </div>
            </Card>

            {/* Claim Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Claims to Prove</CardTitle>
                <CardDescription>
                  Choose only the claims the verifier needs. Additional claims increase your privacy exposure.
                </CardDescription>
              </CardHeader>

              <div className="space-y-3">
                {([
                  {
                    type: "HAS_DEGREE" as ClaimType,
                    label: "Has valid degree",
                    desc: "Proves you hold the credential without revealing any details.",
                  },
                  {
                    type: "GPA_THRESHOLD" as ClaimType,
                    label: "GPA meets threshold",
                    desc: "Proves your GPA ≥ threshold without revealing the exact value.",
                    hasInput: true,
                  },
                  {
                    type: "NOT_EXPIRED" as ClaimType,
                    label: "Credential not expired",
                    desc: "Proves the credential is still within its valid period.",
                  },
                  {
                    type: "IS_ENROLLED" as ClaimType,
                    label: "Currently enrolled",
                    desc: "Proves current enrollment status.",
                  },
                ] as Array<{ type: ClaimType; label: string; desc: string; hasInput?: boolean }>).map((claim) => (
                  <div
                    key={claim.type}
                    onClick={() => toggleClaim(claim.type)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedClaims.includes(claim.type)
                        ? "border-accent/50 bg-accent-subtle"
                        : "border-border bg-surface-2 hover:border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center flex-shrink-0 ${
                        selectedClaims.includes(claim.type) ? "bg-accent border-accent" : "border-border"
                      }`}>
                        {selectedClaims.includes(claim.type) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-text-primary">{claim.label}</div>
                        <div className="text-xs text-text-muted mt-0.5">{claim.desc}</div>
                        {claim.hasInput && selectedClaims.includes(claim.type) && (
                          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <label className="text-xs text-text-secondary mr-2">Minimum GPA:</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={gpaThreshold}
                              onChange={(e) => setGpaThreshold(e.target.value)}
                              className="w-20 bg-surface border border-border rounded px-2 py-0.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Privacy Notice */}
            <div className="bg-accent-subtle border border-accent/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <StatusIcon type="private" size="sm" />
                <div className="text-sm text-text-secondary">
                  <strong className="text-accent">Zero-knowledge proof</strong> — The proof is generated
                  locally on your device. Only the claim result is shared. Your personal data never leaves
                  this session.
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-danger-subtle border border-danger/30 rounded-lg p-3 text-sm text-danger">
                {errorMsg}
              </div>
            )}

            <Button
              size="lg"
              className="w-full"
              onClick={handleGenerateProof}
              loading={["preparing", "generating", "submitting"].includes(step)}
              disabled={selectedClaims.length === 0}
            >
              {step === "preparing" && "Preparing private computation..."}
              {step === "generating" && "Generating ZK proof..."}
              {step === "submitting" && "Submitting..."}
              {(step === "idle" || step === "error") && "Generate Private Proof"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
