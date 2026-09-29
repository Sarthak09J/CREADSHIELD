"use client";

/**
 * CREDShield Wallet Hook
 *
 * Manages wallet connection state.
 * In production this integrates with the Midnight DApp Connector / Lace wallet.
 * In demo mode it simulates a connected wallet for local development.
 */

import { useState, useCallback } from "react";
import type { WalletState, WalletStatus } from "@/types/credential";

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    status: "disconnected",
  });

  const connect = useCallback(async () => {
    setWallet({ status: "connecting" });

    try {
      // Check for Midnight DApp Connector (Lace wallet extension)
      // The connector injects window.midnight when the extension is installed
      const connector = (window as unknown as Record<string, unknown>).midnight;

      if (connector && typeof connector === "object") {
        // Real Lace wallet integration
        // In production: use @midnight-ntwrk/wallet-sdk dapp-connector-api
        setWallet({
          status: "connected",
          address: "mn_addr_1...connected",
          networkId: process.env.NEXT_PUBLIC_NETWORK_ID || "undeployed",
          balance: { dust: "loading...", night: "loading..." },
        });
      } else {
        // Demo mode: simulate wallet for local development / hackathon demo
        await new Promise((r) => setTimeout(r, 1200));
        setWallet({
          status: "connected",
          address: `mn_addr_demo_${Math.random().toString(36).slice(2, 10)}`,
          networkId: process.env.NEXT_PUBLIC_NETWORK_ID || "undeployed",
          balance: { dust: "405,083,000,000,000", night: "1" },
        });
      }
    } catch (err) {
      setWallet({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to connect wallet",
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ status: "disconnected" });
  }, []);

  return { wallet, connect, disconnect };
}
