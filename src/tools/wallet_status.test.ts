import { describe, expect, it } from "vitest";
import type { PayerConfig } from "../types.js";
import { walletStatus } from "./wallet_status.js";

describe("walletStatus", () => {
  it("reports configured flags without exposing private keys", () => {
    const config: PayerConfig = {
      baseUrl: "https://x402.example.com",
      preferredNetwork: "solana",
      solanaPrivateKey: "not-a-real-key",
      evmPrivateKey: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      solanaRpcUrl: "https://api.mainnet-beta.solana.com",
      evmRpcUrl: "https://polygon-rpc.com",
    };

    const result = walletStatus(config);

    expect(result.solanaConfigured).toBe(true);
    expect(result.evmConfigured).toBe(true);
    expect(result.baseUrl).toBe("https://x402.example.com");
    expect(result.preferredNetwork).toBe("solana");

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(config.solanaPrivateKey!);
    expect(serialized).not.toContain(config.evmPrivateKey!);
    expect(serialized).not.toMatch(/privateKey/i);
  });

  it("omits addresses when keys are not configured", () => {
    const config: PayerConfig = {
      baseUrl: "https://x402.example.com",
      preferredNetwork: "solana",
      solanaPrivateKey: "secret",
      solanaRpcUrl: "https://api.mainnet-beta.solana.com",
    };

    const result = walletStatus(config);

    expect(result.solanaConfigured).toBe(true);
    expect(result.evmConfigured).toBe(false);
    expect(result).not.toHaveProperty("evmAddress");
    expect(result).not.toHaveProperty("evmPrivateKey");
  });
});
