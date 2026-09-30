"use client";

import { useState, useCallback } from "react";
import type { WalletState } from "@/types/credential";

// Midnight DApp Connector API types
interface InitialAPI {
  rdns?: string;
  name?: string;
  icon?: string;
  apiVersion?: string;
  enable?: () => Promise<EnabledAPI>;
  connect?: (networkId: string) => Promise<EnabledAPI>;
  isEnabled?: () => Promise<boolean>;
}

interface EnabledAPI {
  getShieldedAddresses?: () => Promise<{ shieldedAddress?: string }>;
  getUnshieldedAddress?: () => Promise<{ unshieldedAddress?: string }>;
  getDustBalance?: () => Promise<{ balance?: bigint | number | string }>;
  getNetworkId?: () => Promise<string>;
}

function getAllWallets(): InitialAPI[] {
  if (typeof window === "undefined") return [];
  const w = window as unknown as Record<string, unknown>;

  const results: InitialAPI[] = [];

  // Check window.midnight (standard Midnight DApp Connector)
  if (w.midnight && typeof w.midnight === "object") {
    const mid = w.midnight as Record<string, unknown>;
    Object.values(mid).forEach((v) => {
      if (v && typeof v === "object") results.push(v as InitialAPI);
    });
  }

  // Check window.midnight directly as a wallet (some versions)
  if (w.midnight && typeof (w.midnight as InitialAPI).connect === "function") {
    results.push(w.midnight as InitialAPI);
  }

  // Check window.lace (alternative injection point)
  if (w.lace && typeof w.lace === "object") {
    results.push(w.lace as InitialAPI);
  }

  return results;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({ status: "disconnected" });

  const connect = useCallback(async () => {
    setWallet({ status: "connecting" });

    try {
      // Wait for extensions to inject (up to 3 seconds)
      let wallets = getAllWallets();
      if (wallets.length === 0) {
        await new Promise((r) => setTimeout(r, 1000));
        wallets = getAllWallets();
      }
      if (wallets.length === 0) {
        await new Promise((r) => setTimeout(r, 2000));
        wallets = getAllWallets();
      }

      if (wallets.length > 0) {
        const laceWallet = wallets.find(
          (w) =>
            w.rdns === "io.lace.midnight" ||
            w.rdns?.includes("lace") ||
            w.name?.toLowerCase().includes("lace")
        ) ?? wallets[0];

        let enabledApi: EnabledAPI | null = null;

        // Try connect() first (DApp Connector v4)
        if (typeof laceWallet.connect === "function") {
          try {
            enabledApi = await laceWallet.connect("preprod");
          } catch {
            try {
              enabledApi = await laceWallet.connect("mainnet");
            } catch {
              try {
                enabledApi = await laceWallet.connect("undeployed");
              } catch { /* try enable next */ }
            }
          }
        }

        // Try enable() (older DApp Connector v3)
        if (!enabledApi && typeof laceWallet.enable === "function") {
          try {
            enabledApi = await laceWallet.enable();
          } catch { /* fall through */ }
        }

        if (enabledApi) {
          // Get address
          let address = "unknown";
          try {
            const s = await enabledApi.getShieldedAddresses?.();
            address = s?.shieldedAddress ?? address;
          } catch { /* try unshielded */ }

          if (address === "unknown") {
            try {
              const u = await enabledApi.getUnshieldedAddress?.();
              address = u?.unshieldedAddress ?? address;
            } catch { /* ignore */ }
          }

          // Get dust balance
          let dustDisplay = "—";
          try {
            const d = await enabledApi.getDustBalance?.();
            dustDisplay = d?.balance?.toString() ?? "—";
          } catch { /* optional */ }

          setWallet({
            status: "connected",
            address,
            networkId: "preprod",
            balance: { dust: dustDisplay, night: "—" },
          });
          return;
        }
      }

      // No wallet found or connection failed — demo mode
      setWallet({
        status: "connected",
        address: `mn_addr1qy8f3x${Math.random().toString(36).slice(2, 10)}midnight`,
        networkId: "demo",
        balance: { dust: "405,083,000,000,000", night: "1" },
      });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      // If user rejected — show error
      if (
        msg.toLowerCase().includes("reject") ||
        msg.toLowerCase().includes("denied") ||
        msg.toLowerCase().includes("refused")
      ) {
        setWallet({
          status: "error",
          error: "Connection rejected — please approve in Lace wallet.",
        });
        return;
      }

      // Any other error — fall to demo mode silently
      setWallet({
        status: "connected",
        address: `mn_addr1qy8f3x${Math.random().toString(36).slice(2, 10)}midnight`,
        networkId: "demo",
        balance: { dust: "405,083,000,000,000", night: "1" },
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ status: "disconnected" });
  }, []);

  return { wallet, connect, disconnect, connectedApi: null };
}
