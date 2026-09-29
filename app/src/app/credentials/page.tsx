"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusIcon } from "@/components/ui/StatusIcon";
import { useWallet } from "@/hooks/useWallet";
import { loadCredentials, type StoredCredential } from "@/lib/credentialStore";
import { truncateHex } from "@/lib/crypto";

const CREDENTIAL_TYPE_LABELS: Record<string, string> = {
  BACHELORS_DEGREE: "Bachelor's Degree",
  MASTERS_DEGREE: "Master's Degree",
  PHD: "PhD",
  DIPLOMA: "Diploma",
  CERTIFICATION: "Certification",
  EMPLOYMENT: "Employment",
  ENROLLMENT: "Enrollment",
};

export default function CredentialsPage() {
  const { wallet, connect } = useWallet();
  const [credentials, setCredentials] = useState<StoredCredential[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPrivate, setShowPrivate] = useState<string | null>(null);

  useEffect(() => {
    setCredentials(loadCredentials());
  }, []);

  const selectedCred = credentials.find((c) => c.card.id === selectedId);

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
            <Link href="/issuer" className="text-sm text-text-secondary hover:text-text-primary">Issuer</Link>
            <Link href="/verifier" className="text-sm text-text-secondary hover:text-text-primary">Verifier</Link>
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

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">My Credentials</h1>
            <p className="text-text-secondary mt-1">
              Your private credential wallet. Only you can see this data.
            </p>
          </div>
          <Link href="/issuer">
            <Button variant="secondary">
              + Add Credential
            </Button>
          </Link>
        </div>

        {credentials.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="font-semibold text-text-primary mb-2">No credentials yet</h3>
              <p className="text-sm text-text-secondary mb-6">
                Get a credential issued by an authorized issuer, or use the demo issuer.
              </p>
              <Link href="/issuer">
                <Button>Go to Issuer Dashboard</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Credential Cards */}
            <div className="space-y-4">
              {credentials.map((stored) => (
                <div
                  key={stored.card.id}
                  onClick={() => setSelectedId(stored.card.id)}
                  className={`bg-surface border rounded-xl p-5 cursor-pointer transition-all ${
                    selectedId === stored.card.id
                      ? "border-accent/50 shadow-glow"
                      : "border-border hover:border-border"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-text-primary">
                        {CREDENTIAL_TYPE_LABELS[stored.card.type] || stored.card.type}
                      </div>
                      <div className="text-sm text-text-secondary">{stored.card.institution}</div>
                    </div>
                    <Badge
                      variant={stored.card.status === "valid" ? "success" : "danger"}
                    >
                      {stored.card.status === "valid" ? "Valid" : stored.card.status}
                    </Badge>
                  </div>

                  <div className="text-sm text-text-secondary mb-3">
                    {stored.card.degree} · {stored.card.expiryYear}
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="private">
                      <StatusIcon type="private" size="sm" />
                      Private Credential
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPrivate(showPrivate === stored.card.id ? null : stored.card.id);
                        }}
                      >
                        {showPrivate === stored.card.id ? "Hide" : "View"}
                      </Button>
                      <Link href={`/proof/${stored.card.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button size="sm">Generate Proof</Button>
                      </Link>
                    </div>
                  </div>

                  {/* Private Data View (holder only) */}
                  {showPrivate === stored.card.id && stored.card.privateData && (
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="text-xs text-accent mb-3 flex items-center gap-1">
                        <StatusIcon type="private" size="sm" />
                        Private data — visible only to you
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ["Name", stored.card.privateData.name],
                          ["Student ID", stored.card.privateData.studentId],
                          ["GPA", stored.card.privateData.gpa.toString()],
                          ["DOB", stored.card.privateData.dateOfBirth],
                          ["Degree", stored.card.privateData.degree],
                          ["University", stored.card.privateData.university],
                        ].map(([label, value]) => (
                          <div key={label} className="bg-surface-3 rounded-lg p-2">
                            <div className="text-xs text-text-muted">{label}</div>
                            <div className="text-xs text-text-primary font-medium mt-0.5">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Credential Detail Panel */}
            {selectedCred ? (
              <Card>
                <CardHeader>
                  <CardTitle>Credential Details</CardTitle>
                  <CardDescription>
                    On-chain references (non-sensitive commitments)
                  </CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-text-muted mb-1">Credential ID</div>
                    <div className="font-mono text-sm text-text-primary">{selectedCred.card.id}</div>
                  </div>

                  <div>
                    <div className="text-xs text-text-muted mb-1">Credential Commitment (on-chain)</div>
                    <div className="font-mono text-xs text-text-secondary break-all">
                      {selectedCred.card.credentialCommitmentHex
                        ? truncateHex(selectedCred.card.credentialCommitmentHex, 16)
                        : "Not available"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-text-muted mb-1">Issuer Commitment (on-chain)</div>
                    <div className="font-mono text-xs text-text-secondary break-all">
                      {selectedCred.card.issuerCommitmentHex
                        ? truncateHex(selectedCred.card.issuerCommitmentHex, 16)
                        : "Not available"}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="text-xs text-text-muted mb-3">Data Disclosure Status</div>
                    {[
                      { field: "Name", status: "hidden" },
                      { field: "Student ID", status: "hidden" },
                      { field: "GPA", status: "hidden" },
                      { field: "Date of Birth", status: "hidden" },
                      { field: "Full Credential", status: "hidden" },
                      { field: "Credential Type", status: "public" },
                      { field: "Verification Status", status: "public" },
                    ].map((item) => (
                      <div key={item.field} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-text-secondary">{item.field}</span>
                        {item.status === "hidden" ? (
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <StatusIcon type="hidden" size="sm" /> Hidden
                          </span>
                        ) : (
                          <Badge variant="default">Public</Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <Link href={`/proof/${selectedCred.card.id}`}>
                    <Button className="w-full" size="lg">
                      Generate Private Proof
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-12 text-text-muted">
                  <StatusIcon type="private" size="lg" />
                  <p className="mt-3 text-sm">Select a credential to view details</p>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
