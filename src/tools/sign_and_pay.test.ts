import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PayerConfig, PaymentAccept } from "../types.js";

vi.mock("../chains/solana.js", () => ({
  paySolana: vi.fn(),
  assertSolanaBalances: vi.fn(async () => undefined),
}));
vi.mock("../chains/evm.js", () => ({
  payEvm: vi.fn(),
  assertEvmBalances: vi.fn(async () => undefined),
}));

import { assertSolanaBalances, paySolana } from "../chains/solana.js";
import { signAndPay } from "./sign_and_pay.js";

const accept: PaymentAccept = {
  scheme: "exact",
  network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  amount: "1000000",
  asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  payTo: "PayTo1111111111111111111111111111111111111",
  maxTimeoutSeconds: 600,
  invoiceNo: "inv-1",
};

const cfg: PayerConfig = {
  baseUrl: "https://x402.example.com",
  preferredNetwork: "solana",
  solanaPrivateKey: "secret",
  solanaRpcUrl: "https://api.mainnet-beta.solana.com",
};

describe("signAndPay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dry_run asserts balances and returns selected accept without paying", async () => {
    const result = await signAndPay({ accepts: [accept], config: cfg, dryRun: true });
    expect(assertSolanaBalances).toHaveBeenCalledOnce();
    expect(paySolana).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      dry_run: true,
      network: accept.network,
      amount: accept.amount,
      invoiceNo: "inv-1",
    });
  });
});
