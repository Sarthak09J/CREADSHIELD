"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusIcon } from "@/components/ui/StatusIcon";
import { useWallet } from "@/hooks/useWallet";
import {
  saveIssuerState,
  loadIssuerState,
  addCredential,
  createStoredCredential,
  type StoredIssuerState,
} from "@/lib/credentialStore";
import {
  generateRandomSecret,
  toHex,
  sha256,
  truncateHex,
} from "@/lib/crypto";
import {
  simulateIssueCredential,
  type SimulatedLedgerState,
} from "@/lib/midnight";
import type { CredentialType, RawCredentialData } from "@/types/credential";
import { deriveCredentialAttributesSecret } from "@/lib/crypto";

type IssueStep = "idle" | "preparing" | "computing" | "submitting" | "done" | "error";

export default function IssuerPage() {
  const { wallet, connect } = useWallet();
  const [issuerState, setIssuerState] = useState<StoredIssuerState | null>(
    () => (typeof window !== "undefined" ? loadIssuerState() : null)
  );
  const [step, setStep] = useState<IssueStep>("idle");
  const [issuedCredential, setIssuedCredential] = useState<SimulatedLedgerState | null>(null);
  const [issuedId, setIssuedId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [form, setForm] = useState({
    holderName: "Private User",
    studentId: "STU-123456",
    degree: "B.Tech Data Science",
    university: "Example University",
    graduationYear: "2027",
    gpa: "8.7",
    dateOfBirth: "01/01/2005",
    credentialType: "BACHELORS_DEGREE" as CredentialType,
    expiryYear: "2027",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const initializeIssuer = async () => {
    const secretKey = generateRandomSecret();
    const issuerCommitment = await sha256(secretKey);
    const state: StoredIssuerState = {
      issuerSecretKeyHex: toHex(secretKey),
      issuerCommitmentHex: toHex(issuerCommitment),
      issuerName: form.university,
    };
    saveIssuerState(state);
    setIssuerState(state);
  };

  const handleIssue = async () => {
    if (!issuerState) {
      setErrorMsg("Initialize issuer identity first.");
      return;
    }
    setStep("preparing");
    setErrorMsg("");

    try {
      // Derive attributes secret from raw credential data (runs locally)
      setStep("computing");
      const attrsSecret = await deriveCredentialAttributesSecret(
        form.holderName,
        form.studentId,
        form.degree,
        form.university,
        parseFloat(form.gpa),
        form.dateOfBirth
      );

      // Simulate the ZK circuit locally (mirrors the Compact contract logic)
      const ledgerState = await simulateIssueCredential(
        issuerState.issuerSecretKeyHex,
        toHex(attrsSecret),
        form.credentialType,
        parseInt(form.expiryYear)
      );

      setStep("submitting");
      // In production: broadcast ledgerState to Midnight via midnight-js
      // For demo mode: store locally and display result
      await new Promise((r) => setTimeout(r, 800)); // simulate tx confirmation

      const credId = `CRED-${Date.now()}`;
      const rawData: RawCredentialData = {
        name: form.holderName,
        studentId: form.studentId,
        degree: form.degree,
        university: form.university,
        graduationYear: parseInt(form.graduationYear),
        gpa: parseFloat(form.gpa),
        dateOfBirth: form.dateOfBirth,
      };

      const stored = await createStoredCredential(
        rawData,
        form.credentialType,
        credId,
        ledgerState.issuer_commitment,
        ledgerState.credential_commitment,
        `demo-contract-${credId}`
      );

      addCredential(stored);
      setIssuedCredential(ledgerState);
      setIssuedId(credId);
      setStep("done");
    } catch (err) {
      setStep("error");
      setErrorMsg(err instanceof Error ? err.message : "Issuance failed");
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

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="accent">Issuer</Badge>
            <span className="text-text-muted text-sm">Authorized credential issuer</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Issuer Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Issue privacy-preserving credentials. Sensitive holder data remains private.
          </p>
        </div>

        {/* Issuer Identity */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Issuer Identity</CardTitle>
            <CardDescription>
              Your issuer identity is derived from a secret key. The key is stored locally and never shared.
            </CardDescription>
          </CardHeader>
          {issuerState ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg">
                <StatusIcon type="verified" />
                <div>
                  <div className="text-sm font-medium text-text-primary">{issuerState.issuerName}</div>
                  <div className="text-xs text-text-muted font-mono">
                    Commitment: {truncateHex(issuerState.issuerCommitmentHex)}
                  </div>
                </div>
                <Badge variant="success" className="ml-auto">Active</Badge>
              </div>
              <p className="text-xs text-text-muted">
                🔒 Issuer secret key is stored locally. The on-chain commitment is a one-way hash.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                No issuer identity found. Initialize one to start issuing credentials.
              </p>
              <Button onClick={initializeIssuer} variant="secondary">
                Initialize Issuer Identity
              </Button>
            </div>
          )}
        </Card>

        {/* Issue Credential Form */}
        {step === "done" && issuedCredential ? (
          <Card glow>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-success/10 rounded-lg">
                <StatusIcon type="verified" size="lg" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Credential Issued ✓</h3>
                <p className="text-sm text-text-secondary">The credential has been created successfully.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-surface-2 rounded-lg p-4">
                <div className="text-xs text-text-muted mb-2">Credential ID</div>
                <div className="font-mono text-sm text-text-primary">{issuedId}</div>
              </div>
              <div className="bg-surface-2 rounded-lg p-4">
                <div className="text-xs text-text-muted mb-2">Privacy</div>
                <div className="flex items-center gap-2">
                  <StatusIcon type="private" size="sm" />
                  <span className="text-sm text-accent">Protected</span>
                </div>
              </div>
              <div className="bg-surface-2 rounded-lg p-4 md:col-span-2">
                <div className="text-xs text-text-muted mb-2">Credential Commitment (on-chain)</div>
                <div className="font-mono text-xs text-text-secondary break-all">
                  {issuedCredential.credential_commitment}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-text-muted mb-4">
                ✓ Sensitive holder data was NOT written to the blockchain.
                Only the opaque commitment hash is on-chain.
              </p>
              <div className="flex gap-3">
                <Link href="/credentials">
                  <Button>View in Credential Wallet</Button>
                </Link>
                <Button variant="secondary" onClick={() => setStep("idle")}>
                  Issue Another
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Issue New Credential</CardTitle>
              <CardDescription>
                Credential data is processed locally. Only opaque commitments are written on-chain.
              </CardDescription>
            </CardHeader>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                { label: "Holder Name", name: "holderName", type: "text" },
                { label: "Student ID", name: "studentId", type: "text" },
                { label: "Degree / Certificate", name: "degree", type: "text" },
                { label: "Institution", name: "university", type: "text" },
                { label: "Graduation Year", name: "graduationYear", type: "number" },
                { label: "GPA", name: "gpa", type: "number" },
                { label: "Date of Birth", name: "dateOfBirth", type: "text" },
                { label: "Expiry Year", name: "expiryYear", type: "number" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    {field.label}
                    {["holderName", "studentId", "gpa", "dateOfBirth"].includes(field.name) && (
                      <span className="ml-2 text-xs text-accent">🔒 Private</span>
                    )}
                  </label>
                  <input
                    name={field.name}
                    type={field.type}
                    value={(form as Record<string, string>)[field.name]}
                    onChange={handleChange}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Credential Type
                </label>
                <select
                  name="credentialType"
                  value={form.credentialType}
                  onChange={handleChange}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="BACHELORS_DEGREE">Bachelor&apos;s Degree</option>
                  <option value="MASTERS_DEGREE">Master&apos;s Degree</option>
                  <option value="PHD">PhD</option>
                  <option value="CERTIFICATION">Certification</option>
                  <option value="EMPLOYMENT">Employment</option>
                  <option value="ENROLLMENT">Enrollment</option>
                </select>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-accent-subtle border border-accent/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <StatusIcon type="private" size="sm" />
                <div>
                  <div className="text-sm font-medium text-accent">Privacy-Preserving Issuance</div>
                  <div className="text-xs text-text-secondary mt-1">
                    Name, Student ID, GPA, and Date of Birth are processed locally to derive a cryptographic commitment.
                    Only the commitment hash is written on-chain. Sensitive data never leaves this device.
                  </div>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-danger-subtle border border-danger/30 rounded-lg p-3 mb-4 text-sm text-danger">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                onClick={handleIssue}
                disabled={!issuerState}
                loading={["preparing", "computing", "submitting"].includes(step)}
                size="lg"
              >
                {step === "preparing" && "Preparing..."}
                {step === "computing" && "Computing ZK commitment..."}
                {step === "submitting" && "Submitting transaction..."}
                {(step === "idle" || step === "error") && "Issue Credential"}
              </Button>
              {!issuerState && (
                <p className="text-xs text-text-muted">Initialize issuer identity first</p>
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
