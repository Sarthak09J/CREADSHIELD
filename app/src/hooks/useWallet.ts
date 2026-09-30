"use client";

import { useState, useCallback } from "react";
import type { WalletState } from "@/types/credential";

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({ status: "disconnected" });

  const connect = useCallback(async () => {
    setWallet({ status: "connecting" });

    // Simulate a brief connection delay (realistic UX)
    await new Promise((r) => setTimeout(r, 800));

    // Always connect successfully in demo mode
    setWallet({
      status: "connected",
      address: `mn_addr1qy8f3x${Math.random().toString(36).slice(2, 10)}midnight`,
      networkId: "preprod",
      balance: { dust: "405,083,000,000,000", night: "1" },
    });
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ status: "disconnected" });
  }, []);

  return { wallet, connect, disconnect, connectedApi: null };
}
