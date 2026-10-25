import { describe, expect, it, vi } from "vitest";
import { buyVpn } from "./buy_vpn.js";
import type { PayerConfig } from "../types.js";

const cfg: PayerConfig = {
  baseUrl: "https://x402.example.com",
  preferredNetwork: "solana",
  solanaPrivateKey: "secret",
  solanaRpcUrl: "https://example.invalid",
};

describe("buyVpn", () => {
  it("dry_run quotes only", async () => {
    const fetchQuote = vi.fn(async () => ({
      status: 402,
      body: {},
      paymentRequired: {
        x402Version: 2,
        invoice_no: "inv-1",
        accepts: [
          {
            scheme: "exact",
            network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            amount: "1000000",
            asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            payTo: "PayTo1111111111111111111111111111111111111",
            maxTimeoutSeconds: 600,
            invoiceNo: "inv-1",
          },
        ],
      },
    }));

    const result = await buyVpn({
      plan: "PREMIUMX1",
      country: "DE",
      dryRun: true,
      config: cfg,
      deps: { fetchQuote, fulfillPayment: vi.fn(), signAndPay: vi.fn(), saveCredentials: vi.fn() },
    });

    expect(result.dry_run).toBe(true);
    expect(result.invoice_no).toBe("inv-1");
    expect(fetchQuote).toHaveBeenCalledOnce();
  });

  it("full path pay + fulfill + save", async () => {
    const fetchQuote = vi.fn(async () => ({
      status: 402,
      body: {},
      paymentRequired: {
        x402Version: 2,
        invoice_no: "inv-1",
        accepts: [
          {
            scheme: "exact",
            network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            amount: "1000000",
            asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            payTo: "PayTo1111111111111111111111111111111111111",
            maxTimeoutSeconds: 600,
            invoiceNo: "inv-1",
          },
        ],
      },
    }));
    const signAndPay = vi.fn(async () => ({
      payment_signature: "sig",
      settlement_tx: "txid",
      network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      amount: "1000000",
      payTo: "PayTo1111111111111111111111111111111111111",
      invoiceNo: "inv-1",
    }));
    const fulfillPayment = vi.fn(async () => ({
      vpn: { username: "u", password: "p" },
    }));
    const saveCredentials = vi.fn(() => "/tmp/vpn.json");

    const result = await buyVpn({
      plan: "PREMIUMX1",
      config: cfg,
      deps: { fetchQuote, fulfillPayment, signAndPay, saveCredentials },
    });

    expect(result.vpn).toEqual({ username: "u", password: "p" });
    expect(result.credentials_path).toBe("/tmp/vpn.json");
    expect(fulfillPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceNo: "inv-1",
        paymentSignature: "sig",
        settlementTx: "txid",
      }),
    );
  });

  it("on fulfill failure after pay, error includes recovery fields and forbids re-buy", async () => {
    const fetchQuote = vi.fn(async () => ({
      status: 402,
      body: {},
      paymentRequired: {
        x402Version: 2,
        invoice_no: "inv-paid",
        accepts: [
          {
            scheme: "exact",
            network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            amount: "1000000",
            asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            payTo: "PayTo1111111111111111111111111111111111111",
            maxTimeoutSeconds: 600,
            invoiceNo: "inv-paid",
          },
        ],
      },
    }));
    const signAndPay = vi.fn(async () => ({
      payment_signature: "sig-b64",
      settlement_tx: "sol-sig",
      network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      amount: "1000000",
      payTo: "PayTo1111111111111111111111111111111111111",
      invoiceNo: "inv-paid",
    }));
    const fulfillPayment = vi.fn(async () => {
      throw new Error("Fulfill failed (HTTP 500): boom");
    });

    await expect(
      buyVpn({
        plan: "PREMIUMX1",
        country: "US",
        config: cfg,
        deps: { fetchQuote, fulfillPayment, signAndPay, saveCredentials: vi.fn() },
      }),
    ).rejects.toThrow(/DO NOT call buy_vpn again[\s\S]*fulfill_payment[\s\S]*inv-paid/i);
  });

  it("supports a new pricing-tier plan id with no client-side changes", async () => {
    const fetchQuote = vi.fn(async () => ({
      status: 402,
      body: {},
      paymentRequired: {
        x402Version: 2,
        invoice_no: "inv-d1",
        accepts: [
          {
            scheme: "exact",
            network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            amount: "990000",
            asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            payTo: "PayTo1111111111111111111111111111111111111",
            maxTimeoutSeconds: 600,
            invoiceNo: "inv-d1",
          },
        ],
      },
    }));
    const signAndPay = vi.fn(async () => ({
      payment_signature: "sig",
      settlement_tx: "txid",
      network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      amount: "990000",
      payTo: "PayTo1111111111111111111111111111111111111",
      invoiceNo: "inv-d1",
    }));
    const fulfillPayment = vi.fn(async () => ({
      vpn: { username: "u", password: "p" },
    }));
    const saveCredentials = vi.fn(() => "/tmp/vpn-d1.json");

    const result = await buyVpn({
      plan: "PREMIUMD1",
      config: cfg,
      deps: { fetchQuote, fulfillPayment, signAndPay, saveCredentials },
    });

    expect(fetchQuote).toHaveBeenCalledWith(cfg.baseUrl, "PREMIUMD1", undefined);
    expect(result.vpn).toEqual({ username: "u", password: "p" });
    expect(result.credentials_path).toBe("/tmp/vpn-d1.json");
  });

  it("passes through socks5 credential fields untouched when the plan includes SOCKS5", async () => {
    const fetchQuote = vi.fn(async () => ({
      status: 402,
      body: {},
      paymentRequired: {
        x402Version: 2,
        invoice_no: "inv-socks5",
        accepts: [
          {
            scheme: "exact",
            network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            amount: "50000",
            asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            payTo: "PayTo1111111111111111111111111111111111111",
            maxTimeoutSeconds: 600,
            invoiceNo: "inv-socks5",
          },
        ],
      },
    }));
    const signAndPay = vi.fn(async () => ({
      payment_signature: "sig",
      settlement_tx: "txid",
      network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      amount: "50000",
      payTo: "PayTo1111111111111111111111111111111111111",
      invoiceNo: "inv-socks5",
    }));
    const fulfillPayment = vi.fn(async () => ({
      vpn: {
        port: 3128,
        connection_string: "https://user:pass@1.2.3.4:3128",
        socks5_port: 3128,
        socks5_connection_string: "socks5://user:pass@1.2.3.4:3128",
      },
    }));
    const saveCredentials = vi.fn(() => "/tmp/vpn-m15.json");

    const result = await buyVpn({
      plan: "PREMIUMM15",
      config: cfg,
      deps: { fetchQuote, fulfillPayment, signAndPay, saveCredentials },
    });

    expect(result.vpn).toEqual({
      port: 3128,
      connection_string: "https://user:pass@1.2.3.4:3128",
      socks5_port: 3128,
      socks5_connection_string: "socks5://user:pass@1.2.3.4:3128",
    });
  });

  it("refuses to pay when quote has no invoice_no", async () => {
    const fetchQuote = vi.fn(async () => ({
      status: 402,
      body: {},
      paymentRequired: {
        x402Version: 2,
        invoice_no: "",
        accepts: [
          {
            scheme: "exact",
            network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            amount: "1000000",
            asset: "mint",
            payTo: "payto",
            maxTimeoutSeconds: 600,
          },
        ],
      },
    }));
    const signAndPay = vi.fn();

    await expect(
      buyVpn({
        plan: "PREMIUMX1",
        config: cfg,
        deps: { fetchQuote, fulfillPayment: vi.fn(), signAndPay, saveCredentials: vi.fn() },
      }),
    ).rejects.toThrow(/invoice/i);
    expect(signAndPay).not.toHaveBeenCalled();
  });
});
