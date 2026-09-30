"use client";

/**
 * CREDShield Wallet Hook — Lace DApp Connector Integration
 *
 * Uses @midnight-ntwrk/dapp-connector-api v4.x to connect to the Lace wallet.
 *
 * How it works:
 *  1. Lace (with Midnight enabled) injects `window.midnight` into the page.
 *     Each key in that object is a UUID, each value is an InitialAPI instance.
 *  2. We find the Lace wallet by its rdns: "io.lace.midnight"
 *  3. We call wallet.connect(networkId) — this triggers Lace's permission prompt.
 *  4. On approval we get a ConnectedAPI with addresses and balances.
 *  5. If Lace is not installed we fall back to demo mode.
 */

import { useState, useCallback } from "react";
import type { WalletState } from "@/types/credential";

// Import the type declarations — this also types window.midnight globally
import type { InitialAPI, ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Returns all wallet InitialAPI instances currently injected by extensions */
function getAvailableWallets(): InitialAPI[] {
  if (typeof window === "undefined") return [];
  const mid = (window as unknown as { midnight?: Record<string, InitialAPI> }).midnight;
  if (!mid || typeof mid !== "object") return [];
  return Object.values(mid);
}

/** Find the Lace Midnight wallet specifically */
function findLaceWallet(): InitialAPI | undefined {
  return getAvailableWallets().find(
    (w) => w.rdns === "io.lace.midnight"
  );
}

/** Resolve which network string to pass to connect() */
function resolveNetworkId(): string {
  const envNet = process.env.NEXT_PUBLIC_NETWORK_ID;
  if (envNet === "preprod") return "preprod";
  if (envNet === "mainnet") return "mainnet";
  // standalone / undeployed local stack
  return "undeployed";
}

// ─── hook ────────────────────────────────────────────────────────────────────

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({ status: "disconnected" });
  const [connectedApi, setConnectedApi] = useState<ConnectedAPI | null>(null);

  const connect = useCallback(async () => {
    setWallet({ status: "connecting" });

    try {
      // ── 1. Try Lace wallet ──────────────────────────────────────────────
      const lace = findLaceWallet();

      if (lace) {
        const networkId = resolveNetworkId();

        // Triggers the Lace permission prompt in the browser
        const api = await lace.connect(networkId);
        setConnectedApi(api);

        // Fetch addresses and balances from the connected wallet
        const [shieldedAddr, unshieldedAddr, dust] = await Promise.all([
          api.getShieldedAddresses(),
          api.getUnshieldedAddress(),
          api.getDustBalance(),
        ]);

        const address =
          shieldedAddr.shieldedAddress ?? unshieldedAddr.unshieldedAddress ?? "unknown";

        const dustBalance = dust.balance?.toString() ?? "0";
        const dustCap    = dust.cap?.toString()     ?? "0";

        setWallet({
          status:    "connected",
          address,
          networkId,
          balance: {
            dust:  `${dustBalance} / ${dustCap}`,
            night: "—",          // Night balance requires separate query
          },
        });
        return;
      }

      // ── 2. Check if any other Midnight wallet is present ───────────────
      const anyWallet = getAvailableWallets()[0];
      if (anyWallet) {
        const networkId = resolveNetworkId();
        const api = await anyWallet.connect(networkId);
        setConnectedApi(api);

        const shieldedAddr = await api.getShieldedAddresses();
        const address = shieldedAddr.shieldedAddress ?? "unknown";

        setWallet({
          status:    "connected",
          address,
          networkId,
          balance: { dust: "—", night: "—" },
        });
        return;
      }

      // ── 3. No wallet extension found — fall back to demo mode ──────────
      await new Promise((r) => setTimeout(r, 1000));
      setWallet({
        status:    "connected",
        address:   `mn_addr_demo_${Math.random().toString(36).slice(2, 10)}`,
        networkId: resolveNetworkId(),
        balance:   { dust: "405,083,000,000,000", night: "1" },
        error:     "Lace wallet not detected — running in demo mode. Install the Lace browser extension and enable Midnight to connect a real wallet.",
      });

    } catch (err: unknown) {
      // Handle user rejection or other connector errors gracefully
      const message =
        err instanceof Error ? err.message : "Failed to connect wallet";

      // User clicked "Reject" in Lace — don't treat as a crash
      const isRejection =
        typeof err === "object" &&
        err !== null &&
        (err as Record<string, unknown>).type === "DAppConnectorAPIError";

      setWallet({
        status: "error",
        error:  isRejection
          ? "Connection rejected. Please approve the request in Lace."
          : message,
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnectedApi(null);
    setWallet({ status: "disconnected" });
  }, []);

  return { wallet, connect, disconnect, connectedApi };
}
