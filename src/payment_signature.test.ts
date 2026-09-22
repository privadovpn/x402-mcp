import { describe, expect, it } from "vitest";
import {
  buildSolanaPaymentSignature,
  buildEvmPaymentSignature,
} from "./payment_signature.js";
import type { PaymentAccept } from "./types.js";

const solAccept: PaymentAccept = {
  scheme: "exact",
  network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  amount: "1000000",
  asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  payTo: "PayTo1111111111111111111111111111111111111",
  maxTimeoutSeconds: 600,
  invoiceNo: "inv-1",
  settlementMode: "payer-submits",
};

describe("payment_signature", () => {
  it("builds solana payment signature base64", () => {
    const txB64 = Buffer.from("fake-tx").toString("base64");
    const sig = buildSolanaPaymentSignature(solAccept, txB64);
    const parsed = JSON.parse(Buffer.from(sig, "base64").toString("utf8"));
    expect(parsed.x402Version).toBe(2);
    expect(parsed.payload.transaction).toBe(txB64);
    expect(parsed.accepted.network).toBe(solAccept.network);
    expect(parsed.accepted.invoiceNo).toBe("inv-1");
  });

  it("builds evm payment signature base64", () => {
    const accept: PaymentAccept = {
      ...solAccept,
      network: "eip155:137",
      asset: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      payTo: "0x2222222222222222222222222222222222222222",
      extra: { name: "USD Coin", version: "2", assetTransferMethod: "eip3009" },
    };
    const sig = buildEvmPaymentSignature(accept, {
      signature: "0xdead",
      authorization: {
        from: "0x1111111111111111111111111111111111111111",
        to: accept.payTo,
        value: accept.amount,
        validAfter: "0",
        validBefore: "9999999999",
        nonce: "0x" + "11".repeat(32),
      },
    });
    const parsed = JSON.parse(Buffer.from(sig, "base64").toString("utf8"));
    expect(parsed.payload.signature).toBe("0xdead");
    expect(parsed.payload.authorization.value).toBe(accept.amount);
  });
});
