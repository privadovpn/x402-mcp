import { describe, expect, it } from "vitest";
import { pickAccept } from "./accept.js";
import type { PaymentAccept, PayerConfig } from "./types.js";

const sol: PaymentAccept = {
  scheme: "exact",
  network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  amount: "1000000",
  asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  payTo: "PayTo1111111111111111111111111111111111111",
  maxTimeoutSeconds: 600,
  invoiceNo: "inv-1",
};

const evm: PaymentAccept = {
  scheme: "exact",
  network: "eip155:137",
  amount: "1000000",
  asset: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  payTo: "0x1111111111111111111111111111111111111111",
  maxTimeoutSeconds: 600,
  invoiceNo: "inv-1",
  extra: { name: "USD Coin", version: "2" },
};

const bothKeys: PayerConfig = {
  baseUrl: "https://x402.example.com",
  preferredNetwork: "solana",
  solanaPrivateKey: "s",
  evmPrivateKey: "0xe",
  solanaRpcUrl: "https://api.mainnet-beta.solana.com",
  evmRpcUrl: "https://polygon-rpc.com",
};

describe("pickAccept", () => {
  it("prefers solana when both keys and preferred=solana", () => {
    expect(pickAccept([sol, evm], bothKeys).network).toMatch(/^solana:/);
  });

  it("prefers evm when preferred=evm", () => {
    expect(
      pickAccept([sol, evm], { ...bothKeys, preferredNetwork: "evm" }).network,
    ).toMatch(/^eip155:/);
  });

  it("uses only available family", () => {
    const solOnly = { ...bothKeys, evmPrivateKey: undefined };
    expect(pickAccept([sol, evm], solOnly).network).toMatch(/^solana:/);
  });

  it("honors forced network", () => {
    expect(pickAccept([sol, evm], bothKeys, "eip155:137").network).toBe("eip155:137");
  });

  it("throws when no payable accept", () => {
    const evmOnly = { ...bothKeys, solanaPrivateKey: undefined };
    expect(() => pickAccept([sol], evmOnly)).toThrow(/No payable/);
  });
});
