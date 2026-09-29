import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CREDShield — Prove your credentials. Reveal nothing unnecessary.",
  description:
    "Privacy-preserving credential verification powered by Midnight. Prove education, employment, and eligibility without disclosing sensitive personal information.",
  keywords: ["credentials", "privacy", "zero-knowledge", "Midnight", "blockchain", "verification"],
  openGraph: {
    title: "CREDShield",
    description: "Prove your credentials. Reveal nothing unnecessary.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
