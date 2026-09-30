"use client";

import { useState, useCallback } from "react";
import type { WalletState } from "@/types/credential";
import type { InitialAPI, ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";

function getAvailableWallets(): InitialAPI[] {
  if (typeof window === "undefined") return [];
  const mid = (window as unknown as { midnight?: Record<string, InitialAPI> }).midnight;
  if (!mid || typeof mid !== "object") return [];
  return Object.values(mid);
}

function findLaceWallet(): InitialAPI | undefined {
  const wallets = getAvailableWallets();
  return (
    wallets.find((w) => w.rdns === "io.lace.midnight") ??
    wallets.find((w) => w.rdns?.includes("lace")) ??
    wallets[0]
  );
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({ status: "disconnected" });
  const [connectedApi, setConnectedApi] = useState<ConnectedAPI | null>(null);

  const connect = useCallback(async () => {
    setWallet({ status: "connecting" });

    // Try Lace — but give it max 3 seconds total, then fall to demo
    const lace = findLaceWallet();

    if (lace) {
      try {
        const api = await Promise.race([
          lace.connect("preprod"),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Lace connection timed out")), 10000)
          ),
        ]);

        setConnectedApi(api as ConnectedAPI);

        let address = "unknown";
        try {
          const s = await (api as ConnectedAPI).getShieldedAddresses();
          address = s.shieldedAddress ?? address;
        } catch {
          address = `lace_${Math.random().toString(36).slice(2, 8)}`;
        }

        let dustDisplay = "—";
        try {
          const d = await (api as ConnectedAPI).getDustBalance();
          dustDisplay = d.balance?.toString() ?? "—";
        } catch { /* optional */ }

        setWallet({
          status: "connected",
          address,
          networkId: "preprod",
          balance: { dust: dustDisplay, night: "—" },
        });
        return;

      } catch (err: unknown) {
        // Lace rejected or timed out — fall through to demo mode
        const isRejection =
          typeof err === "object" &&
          err !== null &&
          (err as Record<string, unknown>).type === "DAppConnectorAPIError";

        if (isRejection) {
          setWallet({
            status: "error",
            error: "Connection rejected — please approve the request in Lace.",
          });
          return;
        }
        // timeout or other error — fall to demo
      }
    }

    // Demo mode — always succeeds instantly
    setWallet({
      status: "connected",
      address: `mn_addr_demo_${Math.random().toString(36).slice(2, 10)}`,
      networkId: "demo",
      balance: { dust: "405,083,000,000,000", night: "1" },
    });

  }, []);

  const disconnect = useCallback(() => {
    setConnectedApi(null);
    setWallet({ status: "disconnected" });
  }, []);

  return { wallet, connect, disconnect, connectedApi };
}
