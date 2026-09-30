"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useWallet } from "@/hooks/useWallet";

export default function LandingPage() {
  const { wallet, connect } = useWallet();

  return (
    <div className="min-h-screen bg-background" style={{ background: "radial-gradient(ellipse at 50% 0%, #1e1035 0%, #0a0a0f 60%)" }}>

      {/* Nav */}
      <nav className="border-b border-border/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span className="font-semibold text-lg text-text-primary">CREDShield</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/verifier" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Verify
            </Link>

            {wallet.status === "connected" ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/30 rounded-lg">
                <span className="w-2 h-2 bg-success rounded-full" />
                <span className="text-xs text-success font-medium">
                  {wallet.address?.slice(0, 14)}...
                </span>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={connect}
                loading={wallet.status === "connecting"}
                variant="secondary"
              >
                {wallet.status === "connecting" ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <Badge variant="accent" className="mb-6">
            <span className="w-1.5 h-1.5 bg-accent rounded-full" />
            Powered by Midnight · Zero-Knowledge Proofs
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold text-text-primary mb-6 leading-tight tracking-tight">
            Prove your credentials.
            <br />
            <span className="text-accent">Reveal nothing</span> unnecessary.
          </h1>

          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10">
            Verify education, employment, and eligibility using privacy-preserving proofs
            powered by Midnight. The verifier sees only what they need — nothing more.
          </p>

          {/* wallet error message */}
          {wallet.status === "error" && (
            <div className="mb-6 mx-auto max-w-md bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 text-sm text-danger">
              {wallet.error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Get Started always goes to dashboard — no wallet gate */}
            <Link href="/dashboard">
              <Button size="lg">
                Get Started
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>

            <Link href="/verifier">
              <Button variant="secondary" size="lg">
                Verify a Credential
              </Button>
            </Link>
          </div>

          {wallet.status === "connected" && (
            <p className="mt-4 text-sm text-success flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Wallet connected ✓ &nbsp;
              <span className="text-text-muted font-mono text-xs">{wallet.address?.slice(0, 20)}...</span>
            </p>
          )}
        </div>

        {/* Privacy Flow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
          {[
            {
              step: "01",
              icon: "🎓",
              title: "Credential",
              desc: "Issuer creates a privacy-preserving credential. Sensitive data stays local.",
              tag: "🔒 Private",
            },
            {
              step: "02",
              icon: "⚡",
              title: "Private Proof",
              desc: "Holder generates a ZK proof on their device. No personal data is broadcast.",
              tag: "⚡ Zero-Knowledge",
            },
            {
              step: "03",
              icon: "✓",
              title: "Verified Claim",
              desc: "Verifier receives only the claim result. Name, GPA, DOB remain hidden.",
              tag: "✓ Verified",
            },
          ].map((item, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-6 relative">
              <div className="text-xs font-mono text-text-muted mb-4">{item.step}</div>
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-text-primary mb-2">{item.title}</h3>
              <p className="text-sm text-text-secondary mb-4">{item.desc}</p>
              <Badge variant={i === 0 ? "private" : i === 1 ? "accent" : "success"}>
                {item.tag}
              </Badge>
              {i < 2 && (
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                  <div className="w-6 h-6 bg-surface-2 border border-border rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selective Disclosure Section */}
        <div className="bg-surface border border-border rounded-xl p-8 mb-20">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Selective Disclosure
              </h2>
              <p className="text-text-secondary mb-6">
                The verifier requests only the claim they need. The holder proves
                it using a ZK proof. Everything else stays private.
              </p>
              <div className="space-y-3">
                {[
                  { req: "Prove Bachelor's degree", result: "✓ Degree verified", hidden: "Name, ID, GPA, DOB" },
                  { req: "Prove GPA ≥ 8.0", result: "✓ Threshold met", hidden: "Exact GPA (8.7 hidden)" },
                  { req: "Prove not expired", result: "✓ Valid", hidden: "Full credential details" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-surface-2 rounded-lg">
                    <div className="w-1.5 h-1.5 mt-2 bg-accent rounded-full flex-shrink-0" />
                    <div>
                      <div className="text-sm text-text-primary">{item.req}</div>
                      <div className="text-xs text-success mt-0.5">{item.result}</div>
                      <div className="text-xs text-text-muted mt-0.5">Hidden: {item.hidden}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Result Preview */}
            <div className="bg-surface-2 border border-border rounded-lg p-6">
              <div className="text-xs font-mono text-text-muted mb-4">VERIFICATION RESULT</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Bachelor&apos;s Degree</span>
                  <Badge variant="success">✓ VERIFIED</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Credential Authenticity</span>
                  <Badge variant="success">✓ VERIFIED</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Issuer</span>
                  <Badge variant="success">✓ VERIFIED</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Credential Status</span>
                  <Badge variant="success">✓ VALID</Badge>
                </div>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="text-xs text-text-muted mb-2">Private information</div>
                  {["Name", "Student ID", "Exact GPA", "Date of Birth", "Full Credential"].map((field) => (
                    <div key={field} className="flex items-center justify-between py-1">
                      <span className="text-xs text-text-muted">{field}</span>
                      <span className="text-xs text-text-muted">🔒 Hidden</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              role: "Issuer",
              desc: "Universities, employers, and certification authorities issue privacy-preserving credentials.",
              link: "/issuer",
              linkText: "Issuer Dashboard",
              icon: "🏛️",
            },
            {
              role: "Holder",
              desc: "Keep your credentials private. Share only what's needed, when you choose to share it.",
              link: "/credentials",
              linkText: "My Credentials",
              icon: "👤",
            },
            {
              role: "Verifier",
              desc: "Request specific claims. Verify credentials without accessing unnecessary personal data.",
              link: "/verifier",
              linkText: "Verify Credentials",
              icon: "🔍",
            },
          ].map((item) => (
            <div key={item.role} className="bg-surface-2 border border-border rounded-xl p-6">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-text-primary mb-2">{item.role}</h3>
              <p className="text-sm text-text-secondary mb-4">{item.desc}</p>
              <Link href={item.link}>
                <Button variant="ghost" size="sm" className="w-full">
                  {item.linkText} →
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-text-muted border-t border-border pt-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Privacy-preserving verification powered by Midnight
          </div>
          <p>Built for the Midnight Hackathon · Confidential Credentials</p>
        </div>
      </main>
    </div>
  );
}
