import { describe, expect, it, vi } from "vitest";
import { fulfillVpnPayment } from "./fulfill_payment.js";
import type { PayerConfig } from "../types.js";

const cfg: PayerConfig = {
  baseUrl: "https://x402.example.com",
  preferredNetwork: "solana",
  solanaPrivateKey: "secret",
  solanaRpcUrl: "https://example.invalid",
};

describe("fulfillVpnPayment", () => {
  it("fulfills and saves credentials without quoting or paying", async () => {
    const fulfillPayment = vi.fn(async () => ({
      vpn: { username: "u", password: "p" },
    }));
    const saveCredentials = vi.fn(() => "/tmp/vpn.json");

    const result = await fulfillVpnPayment({
      plan: "premiumx1",
      invoiceNo: "pv-abc",
      paymentSignature: "sig",
      settlementTx: "txid",
      country: "US",
      config: cfg,
      deps: { fulfillPayment, saveCredentials },
    });

    expect(fulfillPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "PREMIUMX1",
        invoiceNo: "pv-abc",
        paymentSignature: "sig",
        settlementTx: "txid",
        country: "US",
      }),
    );
    expect(result.credentials_path).toBe("/tmp/vpn.json");
    expect(result.invoice_no).toBe("pv-abc");
  });

  it("rejects empty invoice_no before calling API", async () => {
    const fulfillPayment = vi.fn();
    await expect(
      fulfillVpnPayment({
        plan: "PREMIUMX1",
        invoiceNo: "  ",
        paymentSignature: "sig",
        settlementTx: "txid",
        config: cfg,
        deps: { fulfillPayment, saveCredentials: vi.fn() },
      }),
    ).rejects.toThrow(/invoice_no/);
    expect(fulfillPayment).not.toHaveBeenCalled();
  });
});
