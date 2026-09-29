"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusIcon } from "@/components/ui/StatusIcon";
import { useWallet } from "@/hooks/useWallet";
import { loadCredentials } from "@/lib/credentialStore";
import type { StoredCredential } from "@/lib/credentialStore";

function NavBar({ walletStatus, walletAddress, onConnect }: {
  walletStatus: string;
  walletAddress?: string;
  onConnect: () => void;
}) {
  return (
    <nav className="border-b border-border px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span className="font-semibold text-text-primary">CREDShield</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/credentials" className="text-sm text-text-secondary hover:text-text-primary">My Credentials</Link>
          <Link href="/issuer" className="text-sm text-text-secondary hover:text-text-primary">Issuer</Link>
          <Link href="/verifier" className="text-sm text-text-secondary hover:text-text-primary">Verifier</Link>
          {walletStatus === "connected" ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/30 rounded-lg">
              <span className="w-2 h-2 bg-success rounded-full" />
              <span className="text-xs text-success font-medium">{walletAddress?.slice(0, 12)}...</span>
            </div>
          ) : (
            <Button size="sm" onClick={onConnect} loading={walletStatus === "connecting"}>
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function DashboardPage() {
  const { wallet, connect } = useWallet();
  const [credentials, setCredentials] = useState<StoredCredential[]>([]);

  useEffect(() => {
    setCredentials(loadCredentials());
  }, []);

  const stats = [
    {
      label: "My Credentials",
      value: credentials.length.toString(),
      icon: "🔐",
      badge: credentials.length > 0 ? "Private" : "None",
      badgeVariant: "private" as const,
      link: "/credentials",
    },
    {
      label: "Proof Requests",
      value: "0",
      icon: "📋",
      badge: "Pending",
      badgeVariant: "warning" as const,
      link: "/verifier",
    },
    {
      label: "Verified Claims",
      value: "0",
      icon: "✓",
      badge: "Verified",
      badgeVariant: "success" as const,
      link: "/verifier",
    },
    {
      label: "Privacy Status",
      value: "Active",
      icon: "🛡",
      badge: "Protected",
      badgeVariant: "accent" as const,
      link: "/",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        walletStatus={wallet.status}
        walletAddress={wallet.address}
        onConnect={connect}
      />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Manage your private credentials and proof requests.
          </p>
        </div>

        {wallet.status !== "connected" && (
          <Card className="mb-8 border-accent/30" glow>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent-subtle rounded-lg">
                <StatusIcon type="private" size="lg" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary">Connect your wallet</h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  Connect your Midnight wallet to access your private credentials.
                </p>
              </div>
              <Button onClick={connect} loading={wallet.status === "connecting"}>
                Connect Wallet
              </Button>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => (
            <Link href={stat.link} key={stat.label}>
              <div className="bg-surface border border-border rounded-xl p-5 hover:border-accent/30 transition-colors cursor-pointer">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-text-secondary mb-2">{stat.label}</div>
                <Badge variant={stat.badgeVariant}>{stat.badge}</Badge>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardHeader>
              <CardTitle>Issue a Credential</CardTitle>
              <CardDescription>
                Create a new privacy-preserving credential as an issuer.
              </CardDescription>
            </CardHeader>
            <Link href="/issuer">
              <Button variant="secondary" className="w-full">
                Open Issuer Dashboard
              </Button>
            </Link>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Credential Wallet</CardTitle>
              <CardDescription>
                View and manage your private credentials. Generate ZK proofs.
              </CardDescription>
            </CardHeader>
            <Link href="/credentials">
              <Button variant="secondary" className="w-full">
                View My Credentials
              </Button>
            </Link>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verify a Credential</CardTitle>
              <CardDescription>
                Request proof of a specific claim from a credential holder.
              </CardDescription>
            </CardHeader>
            <Link href="/verifier">
              <Button variant="secondary" className="w-full">
                Open Verifier Dashboard
              </Button>
            </Link>
          </Card>
        </div>

        {/* Privacy Model Explainer */}
        <Card>
          <CardHeader>
            <CardTitle>How Privacy Works</CardTitle>
            <CardDescription>
              CREDShield uses Midnight&apos;s zero-knowledge proof system.
            </CardDescription>
          </CardHeader>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-success mb-3 flex items-center gap-2">
                <StatusIcon type="verified" size="sm" /> Public (on-chain)
              </h4>
              <ul className="space-y-2">
                {[
                  "Credential commitment (opaque hash)",
                  "Issuer commitment (opaque hash)",
                  "Credential type",
                  "Revocation status",
                  "Verification count",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="w-1.5 h-1.5 bg-success rounded-full mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-accent mb-3 flex items-center gap-2">
                <StatusIcon type="private" size="sm" /> Private (local only)
              </h4>
              <ul className="space-y-2">
                {[
                  "Full name",
                  "Student ID",
                  "Exact GPA",
                  "Date of birth",
                  "Credential attributes",
                  "Issuer secret key",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
