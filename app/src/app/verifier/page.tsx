"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusIcon } from "@/components/ui/StatusIcon";
import { useWallet } from "@/hooks/useWallet";
import { simulateVerifyDegreeClaim, simulateVerifyGpaThreshold, type SimulatedLedgerState } from "@/lib/midnight";
import { fromHex } from "@/lib/crypto";
import type { ClaimType, CredentialType } from "@/types/credential";

type VerifyStep = "form" | "verifying" | "result";

export default function VerifierPage() {
  const { wallet, connect } = useWallet();
  const [step, setStep] = useState<VerifyStep>("form");
  const [verifyResult, setVerifyResult] = useState<{
    overall: boolean;
    claims: Array<{ claim: string; verified: boolean }>;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Verifier inputs
  const [form, setForm] = useState({
    verifierOrg: "TechCorp",
    credentialType: "BACHELORS_DEGREE" as CredentialType,
    claims: ["HAS_DEGREE"] as ClaimType[],
    gpaThreshold: "8.0",
    credentialCommitment: "",
    issuerCommitment: "",
    expiryYear: "2027",
    revocationFlag: "0",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleClaim = (claim: ClaimType) => {
    setForm((prev) => ({
      ...prev,
      claims: prev.claims.includes(claim)
        ? prev.claims.filter((c) => c !== claim)
        : [...prev.claims, claim],
    }));
  };

  const handleVerify = async () => {
    if (!form.credentialCommitment || !form.issuerCommitment) {
      setErrorMsg("Please enter the credential commitment and issuer commitment from the holder.");
      return;
    }

    setStep("verifying");
    setErrorMsg("");

    try {
      // In a real Midnight flow, the verifier would receive a ZK proof from the holder
      // and submit it to the Midnight node for on-chain verification.
      // For demo: we simulate the on-chain state verification.
      const ledger: SimulatedLedgerState = {
        credential_commitment: form.credentialCommitment.trim(),
        issuer_commitment: form.issuerCommitment.trim(),
        credential_type: new Array(64).fill("0").join(""),
        revocation_flag: parseInt(form.revocationFlag),
        expiry_year: parseInt(form.expiryYear),
        verification_count: 0,
        last_verified_at: 0,
      };

      await new Promise((r) => setTimeout(r, 800));

      const results: Array<{ claim: string; verified: boolean }> = [];

      // The verifier doesn't have the holder's private attributes — they only verify
      // the on-chain state. In a full Midnight flow, the holder's proof is submitted
      // and the chain verifies it.
      // For demo: check revocation status and expiry as public verifications.
      for (const claim of form.claims) {
        if (claim === "HAS_DEGREE") {
          // Verifier checks: is the credential commitment set and not revoked?
          const verified =
            ledger.credential_commitment.length > 0 &&
            ledger.revocation_flag === 0;
          results.push({ claim: "Has valid degree", verified });
        } else if (claim === "GPA_THRESHOLD") {
          // Without the holder's proof, the verifier cannot verify GPA threshold
          // This would require the holder to submit a ZK proof first
          results.push({
            claim: `GPA ≥ ${form.gpaThreshold} (requires holder proof)`,
            verified: false,
          });
        } else if (claim === "NOT_EXPIRED") {
          const verified = ledger.revocation_flag === 0 && ledger.expiry_year >= 2026;
          results.push({ claim: "Credential not expired", verified });
        }
      }

      setVerifyResult({
        overall: results.every((r) => r.verified),
        claims: results,
      });
      setStep("result");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Verification failed");
      setStep("form");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span className="font-semibold">CREDShield</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-text-secondary hover:text-text-primary">Dashboard</Link>
            <Link href="/credentials" className="text-sm text-text-secondary hover:text-text-primary">My Credentials</Link>
            {wallet.status === "connected" ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/30 rounded-lg">
                <span className="w-2 h-2 bg-success rounded-full" />
                <span className="text-xs text-success">{wallet.address?.slice(0, 12)}...</span>
              </div>
            ) : (
              <Button size="sm" onClick={connect}>Connect Wallet</Button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="accent">Verifier</Badge>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Verifier Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Request and verify specific credential claims. No unnecessary personal data is disclosed.
          </p>
        </div>

        {step === "result" && verifyResult ? (
          /* Verification Result */
          <div className="space-y-6">
            <Card glow>
              <div className="text-xs font-mono text-text-muted mb-4">CREDENTIAL VERIFICATION</div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-lg ${verifyResult.overall ? "bg-success/10" : "bg-danger/10"}`}>
                  <StatusIcon type={verifyResult.overall ? "verified" : "failed"} size="lg" />
                </div>
                <div>
                  <div className="text-xl font-bold text-text-primary">
                    {verifyResult.overall ? "VERIFIED ✓" : "VERIFICATION FAILED ✕"}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {form.verifierOrg} · {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Claim Results */}
              <div className="space-y-3 mb-6">
                {verifyResult.claims.map((c, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${
                    c.verified ? "bg-success/5 border-success/20" : "bg-danger/5 border-danger/20"
                  }`}>
                    <div className="flex items-center gap-2">
                      <StatusIcon type={c.verified ? "verified" : "failed"} size="sm" />
                      <span className="text-sm text-text-primary">{c.claim}</span>
                    </div>
                    <Badge variant={c.verified ? "success" : "danger"}>
                      {c.verified ? "✓ VERIFIED" : "✕ FAILED"}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Privacy Summary */}
              <div className="border-t border-border pt-4">
                <div className="text-xs text-text-muted mb-3">Private information</div>
                <div className="space-y-1">
                  {[
                    "Name",
                    "Student ID",
                    "Exact GPA",
                    "Date of Birth",
                    "Full Credential",
                  ].map((field) => (
                    <div key={field} className="flex items-center justify-between py-1">
                      <span className="text-sm text-text-secondary">{field}</span>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <StatusIcon type="hidden" size="sm" /> Hidden
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="bg-accent-subtle border border-accent/20 rounded-lg p-4 text-sm text-text-secondary">
              <strong className="text-accent">Privacy-preserving verification</strong> — Only the requested
              claim result was verified. Personal information was not disclosed or accessible.
              Powered by Midnight zero-knowledge proofs.
            </div>

            <Button variant="secondary" onClick={() => { setStep("form"); setVerifyResult(null); }}>
              ← New Verification Request
            </Button>
          </div>
        ) : (
          /* Verification Request Form */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Verification Request</CardTitle>
                <CardDescription>
                  Specify only the claims you need to verify. The holder proves them without revealing unnecessary data.
                </CardDescription>
              </CardHeader>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Organization</label>
                  <input
                    name="verifierOrg"
                    value={form.verifierOrg}
                    onChange={handleChange}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Credential Type</label>
                  <select
                    name="credentialType"
                    value={form.credentialType}
                    onChange={handleChange}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="BACHELORS_DEGREE">Bachelor's Degree</option>
                    <option value="MASTERS_DEGREE">Master's Degree</option>
                    <option value="CERTIFICATION">Certification</option>
                    <option value="EMPLOYMENT">Employment</option>
                    <option value="ENROLLMENT">Enrollment</option>
                  </select>
                </div>
              </div>

              {/* Claim Selection */}
              <div className="mb-6">
                <div className="text-sm font-medium text-text-secondary mb-3">Claims to Verify</div>
                <div className="space-y-2">
                  {([
                    { type: "HAS_DEGREE" as ClaimType, label: "Has valid degree" },
                    { type: "GPA_THRESHOLD" as ClaimType, label: "GPA meets threshold" },
                    { type: "NOT_EXPIRED" as ClaimType, label: "Credential not expired" },
                  ] as Array<{ type: ClaimType; label: string }>).map((claim) => (
                    <div
                      key={claim.type}
                      onClick={() => toggleClaim(claim.type)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                        form.claims.includes(claim.type)
                          ? "border-accent/50 bg-accent-subtle"
                          : "border-border bg-surface-2"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        form.claims.includes(claim.type) ? "bg-accent border-accent" : "border-border"
                      }`}>
                        {form.claims.includes(claim.type) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-text-primary">{claim.label}</span>
                    </div>
                  ))}
                </div>
                {form.claims.includes("GPA_THRESHOLD") && (
                  <div className="mt-3 ml-7">
                    <label className="text-xs text-text-secondary mr-2">Minimum GPA required:</label>
                    <input
                      type="number"
                      name="gpaThreshold"
                      step="0.1"
                      min="0"
                      max="10"
                      value={form.gpaThreshold}
                      onChange={handleChange}
                      className="w-20 bg-surface border border-border rounded px-2 py-0.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* On-chain data from holder */}
              <div className="mb-6">
                <div className="text-sm font-medium text-text-secondary mb-3">
                  Credential Reference (from holder)
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">
                      Credential Commitment (on-chain hash)
                    </label>
                    <input
                      name="credentialCommitment"
                      placeholder="Paste credential commitment hex..."
                      value={form.credentialCommitment}
                      onChange={handleChange}
                      className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">
                      Issuer Commitment (on-chain hash)
                    </label>
                    <input
                      name="issuerCommitment"
                      placeholder="Paste issuer commitment hex..."
                      value={form.issuerCommitment}
                      onChange={handleChange}
                      className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Expiry Year</label>
                      <input
                        name="expiryYear"
                        type="number"
                        value={form.expiryYear}
                        onChange={handleChange}
                        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Revocation Flag</label>
                      <select
                        name="revocationFlag"
                        value={form.revocationFlag}
                        onChange={handleChange}
                        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                      >
                        <option value="0">0 — Valid</option>
                        <option value="1">1 — Revoked</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="bg-success/5 border border-success/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <StatusIcon type="verified" size="sm" />
                  <div className="text-xs text-text-secondary">
                    <strong className="text-success">Data not requested:</strong> None
                    <br />
                    The holder&apos;s personal information will not be disclosed to you.
                    Only the claim results will be shared.
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-danger-subtle border border-danger/30 rounded-lg p-3 mb-4 text-sm text-danger">
                  {errorMsg}
                </div>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={handleVerify}
                loading={step === "verifying"}
                disabled={form.claims.length === 0}
              >
                {step === "verifying" ? "Verifying..." : "Verify Credential"}
              </Button>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
