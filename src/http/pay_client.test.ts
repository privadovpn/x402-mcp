import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchQuote, fulfillPayment } from "./pay_client.js";
import type { PaymentRequired } from "../types.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchQuote", () => {
  it("decodes PAYMENT-REQUIRED header", async () => {
    const pr: PaymentRequired = {
      x402Version: 2,
      invoice_no: "inv-1",
      accepts: [
        {
          scheme: "exact",
          network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
          amount: "1000000",
          asset: "mint",
          payTo: "payto",
          maxTimeoutSeconds: 600,
          invoiceNo: "inv-1",
        },
      ],
    };
    const header = Buffer.from(JSON.stringify(pr), "utf8").toString("base64");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 402,
        headers: { get: (n: string) => (n.toLowerCase() === "payment-required" ? header : null) },
        json: async () => ({ error: "Payment required" }),
      })),
    );
    const q = await fetchQuote("https://x402.example.com", "PREMIUMX1", "DE");
    expect(q.status).toBe(402);
    expect(q.paymentRequired.invoice_no).toBe("inv-1");
    expect(q.paymentRequired.accepts[0].network).toMatch(/^solana:/);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("plan=PREMIUMX1"),
      expect.objectContaining({ method: "GET" }),
    );
    expect(String((fetch as any).mock.calls[0][0])).toContain("country=DE");
  });

  it("throws when PAYMENT-REQUIRED missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 500,
        headers: { get: () => null },
        json: async () => ({ error: "boom" }),
      })),
    );
    await expect(fetchQuote("https://x402.example.com", "PREMIUMX1")).rejects.toThrow(
      /PAYMENT-REQUIRED/,
    );
  });
});

describe("fulfillPayment", () => {
  it("sends PAYMENT-SIGNATURE and X-Settlement-Transaction", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ vpn: { username: "u", password: "p" } }),
      })),
    );
    const body = await fulfillPayment({
      baseUrl: "https://x402.example.com",
      plan: "PREMIUMX1",
      invoiceNo: "inv-1",
      paymentSignature: "sig",
      settlementTx: "txhash",
      country: "DE",
    });
    expect(body.vpn).toEqual({ username: "u", password: "p" });
    const [, init] = (fetch as any).mock.calls[0];
    expect(init.headers["PAYMENT-SIGNATURE"]).toBe("sig");
    expect(init.headers["X-Settlement-Transaction"]).toBe("txhash");
  });

  it("throws with status on non-ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 409,
        json: async () => ({ error: "already paid" }),
      })),
    );
    await expect(
      fulfillPayment({
        baseUrl: "https://x402.example.com",
        plan: "PREMIUMX1",
        invoiceNo: "inv-1",
        paymentSignature: "sig",
        settlementTx: "tx",
      }),
    ).rejects.toThrow(/409/);
  });
});
