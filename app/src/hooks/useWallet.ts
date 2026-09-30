"use client";

import { useState, useCallback } from "react";
import type { WalletState } from "@/types/credential";
import type { InitialAPI, ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";

// ─── helpers ──────────────────────────────────────────────────────────────────

function getAvailableWallets(): InitialAPI[] {
  if (typeof window === "undefined") return [];
  const mid = (window as unknown as { midnight?: Record<string, InitialAPI> }).midnight;
  if (!mid || typeof mid !== "object") return [];
  return Object.values(mid);
}

function findLaceWallet(): InitialAPI | undefined {
  const wallets = getAvailableWallets();
  // Try exact Lace rdns first, then fall back to any available wallet
  return (
    wallets.find((w) => w.rdns === "io.lace.midnight") ??
    wallets.find((w) => w.rdns?.includes("lace")) ??
    wallets[0]
  );
}

// Lace on preprod uses "preprod", on mainnet uses "mainnet"
// For local dev without Lace we use demo mode
function resolveNetworkId(): string {
  const envNet = process.env.NEXT_PUBLIC_NETWORK_ID;
  if (envNet === "mainnet") return "mainnet";
  // Default to preprod for Lace — this is the live testnet Lace supports
  return "preprod";
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({ status: "disconnected" });
  const [connectedApi, setConnectedApi] = useState<ConnectedAPI | null>(null);

  const connect = useCallback(async () => {
    setWallet({ status: "connecting" });

    try {
      // Give Lace extension up to 2 seconds to inject window.midnight
      // (it can be slow on first page load)
      let lace = findLaceWallet();
      if (!lace) {
        await new Promise((r) => setTimeout(r, 2000));
        lace = findLaceWallet();
      }

      if (lace) {
        const networkId = resolveNetworkId();

        // Triggers the Lace permission popup
        const api = await lace.connect(networkId);
        setConnectedApi(api);

        // Get wallet address
        let address = "unknown";
        try {
          const shielded = await api.getShieldedAddresses();
          address = shielded.shieldedAddress ?? address;
        } catch {
          try {
            const unshielded = await api.getUnshieldedAddress();
            address = unshielded.unshieldedAddress ?? address;
          } catch {
            address = `lace_${Math.random().toString(36).slice(2, 10)}`;
          }
        }

        // Get DUST balance (optional — don't fail if unavailable)
        let dustDisplay = "—";
        try {
          const dust = await api.getDustBalance();
          dustDisplay = dust.balance?.toString() ?? "—";
        } catch {
          // balance not critical
        }

        setWallet({
          status: "connected",
          address,
          networkId,
          balance: { dust: dustDisplay, night: "—" },
        });
        return;
      }

      // No Lace extension found — run in demo mode
      await new Promise((r) => setTimeout(r, 800));
      setWallet({
        status: "connected",
        address: `mn_addr_demo_${Math.random().toString(36).slice(2, 10)}`,
        networkId: "demo",
        balance: { dust: "405,083,000,000,000", night: "1" },
      });

    } catch (err: unknown) {
      const isRejection =
        typeof err === "object" &&
        err !== null &&
        (err as Record<string, unknown>).type === "DAppConnectorAPIError";

      const message = err instanceof Error ? err.message : String(err);

      setWallet({
        status: "error",
        error: isRejection
          ? "Connection rejected — please approve the request in Lace."
          : `Connection failed: ${message}`,
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnectedApi(null);
    setWallet({ status: "disconnected" });
  }, []);

  return { wallet, connect, disconnect, connectedApi };
}
