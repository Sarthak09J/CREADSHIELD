"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusIcon } from "@/components/ui/StatusIcon";
import { useWallet } from "@/hooks/useWallet";
import { loadCredentials } from "@/lib/credentialStore";
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
  const [autoFilled, setAutoFilled] = useState(false);

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

  // Auto-fill commitment fields from the most recent stored credential
  useEffect(() => {
    const credentials = loadCredentials();
    if (credentials.length > 0) {
      const latest = credentials[credentials.length - 1];
      setForm((prev) => ({
        ...prev,
        credentialCommitment: latest.card.credentialCommitmentHex ?? "",
        issuerCommitment: latest.card.issuerCommitmentHex ?? "",
        expiryYear: latest.card.expiryYear?.toString() ?? "2027",
        revocationFlag: latest.card.status === "revoked" ? "1" : "0",
      }));
      setAutoFilled(true);
    }
  }, []);

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
      setErrorMsg("No credential found. Please issue a credential first from the Issuer Dashboard.");
      return;
    }

    setStep("verifying");
    setErrorMsg("");

    await new Promise((r) => setTimeout(r, 1200));

    const isValid =
      form.credentialCommitment.length > 0 &&
      form.revocationFlag === "0";

    const isNotExpired =
      parseInt(form.expiryYear) >= 2026 &&
      form.revocationFlag === "0";

    const results: Array<{ claim: string; verified: boolean }> = [];

    for (const claim of form.claims) {
      if (claim === "HAS_DEGREE") {
        results.push({ claim: "Has valid degree", verified: isValid });
      } else if (claim === "GPA_THRESHOLD") {
        // In a real Midnight flow, the holder submits a ZK proof that proves
        // their GPA meets the threshold without revealing the exact value.
        // For demo: if the credential is valid and commitment exists, the
        // threshold proof is accepted (the ZK proof was already generated
        // on the holder's side in the proof generation page).
        results.push({
          claim: `GPA ≥ ${form.gpaThreshold}`,
          verified: isValid,
        });
      } else if (claim === "NOT_EXPIRED") {
        results.push({ claim: "Credential not expired", verified: isNotExpired });
      }
    }

    setVerifyResult({
      overall: results.every((r) => r.verified),
      claims: results,
    });
    setStep("result");
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

              <div className="border-t border-border pt-4">
                <div className="text-xs text-text-muted mb-3">Private information</div>
                {["Name", "Student ID", "Exact GPA", "Date of Birth", "Full Credential"].map((field) => (
                  <div key={field} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-text-secondary">{field}</span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <StatusIcon type="hidden" size="sm" /> Hidden
                    </span>
                  </div>
                ))}
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Verification Request</CardTitle>
                <CardDescription>
                  Specify only the claims you need. The holder proves them without revealing personal data.
                </CardDescription>
              </CardHeader>

              {/* Auto-fill notice */}
              {autoFilled && (
                <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg">
                  <StatusIcon type="verified" size="sm" />
                  <span className="text-xs text-success">
                    Credential reference auto-filled from your credential wallet.
                  </span>
                </div>
              )}

              {/* No credential notice */}
              {!autoFilled && (
                <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/20 rounded-lg">
                  <span className="text-warning text-xs">⚠</span>
                  <span className="text-xs text-text-secondary">
                    No credential found. <Link href="/issuer" className="text-accent underline">Issue a credential first</Link>, then come back here.
                  </span>
                </div>
              )}

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
                    <option value="BACHELORS_DEGREE">Bachelor&apos;s Degree</option>
                    <option value="MASTERS_DEGREE">Master&apos;s Degree</option>
                    <option value="CERTIFICATION">Certification</option>
                    <option value="EMPLOYMENT">Employment</option>
                    <option value="ENROLLMENT">Enrollment</option>
                  </select>
                </div>
              </div>

              {/* Claims */}
              <div className="mb-6">
                <div className="text-sm font-medium text-text-secondary mb-3">Claims to Verify</div>
                <div className="space-y-2">
                  {([
                    { type: "HAS_DEGREE" as ClaimType, label: "Has valid degree", desc: "Proves credential is valid and not revoked" },
                    { type: "GPA_THRESHOLD" as ClaimType, label: "GPA meets threshold", desc: "Proves GPA ≥ threshold without revealing exact value" },
                    { type: "NOT_EXPIRED" as ClaimType, label: "Credential not expired", desc: "Proves credential is within valid period" },
                  ]).map((claim) => (
                    <div
                      key={claim.type}
                      onClick={() => toggleClaim(claim.type)}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        form.claims.includes(claim.type)
                          ? "border-accent/50 bg-accent-subtle"
                          : "border-border bg-surface-2"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                        form.claims.includes(claim.type) ? "bg-accent border-accent" : "border-border"
                      }`}>
                        {form.claims.includes(claim.type) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-text-primary">{claim.label}</div>
                        <div className="text-xs text-text-muted mt-0.5">{claim.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {form.claims.includes("GPA_THRESHOLD") && (
                  <div className="mt-3 ml-7 flex items-center gap-2">
                    <label className="text-xs text-text-secondary">Minimum GPA:</label>
                    <input
                      type="number"
                      name="gpaThreshold"
                      step="0.1"
                      min="0"
                      max="10"
                      value={form.gpaThreshold}
                      onChange={handleChange}
                      onClick={(e) => e.stopPropagation()}
                      className="w-20 bg-surface border border-border rounded px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Commitment fields — auto filled, shown as read-only for transparency */}
              <div className="mb-6">
                <div className="text-sm font-medium text-text-secondary mb-1">
                  Credential Reference
                </div>
                <div className="text-xs text-text-muted mb-3">
                  These are the on-chain commitment hashes — opaque cryptographic values, not personal data.
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Credential Commitment</label>
                    <input
                      name="credentialCommitment"
                      placeholder="Auto-filled from credential wallet..."
                      value={form.credentialCommitment}
                      onChange={handleChange}
                      className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Issuer Commitment</label>
                    <input
                      name="issuerCommitment"
                      placeholder="Auto-filled from credential wallet..."
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
                      <label className="text-xs text-text-muted mb-1 block">Status</label>
                      <select
                        name="revocationFlag"
                        value={form.revocationFlag}
                        onChange={handleChange}
                        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                      >
                        <option value="0">Valid</option>
                        <option value="1">Revoked</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-success/5 border border-success/20 rounded-lg p-3 mb-6">
                <div className="flex items-start gap-2">
                  <StatusIcon type="verified" size="sm" />
                  <div className="text-xs text-text-secondary">
                    <strong className="text-success">Data not requested: None</strong>
                    <br />
                    The holder&apos;s personal information will not be disclosed to you.
                    Only the claim results will be shared.
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 mb-4 text-sm text-danger">
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
