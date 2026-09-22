import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchVpnCatalog } from "./discovery_client.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchVpnCatalog", () => {
  it("parses plans and countries from discovery manifest", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          x402Version: 2,
          paymentEndpoint: "https://x402.example.com/pay",
          settlementMode: "payer-submits",
          countries: ["de", "US"],
          resources: [
            {
              plans: [
                { id: "PREMIUMX1", price_usd: 1.0, duration_minutes: 60 },
                { id: "PREMIUMX3", price_usd: 3.0, duration_minutes: 180 },
              ],
            },
          ],
        }),
      })),
    );

    const catalog = await fetchVpnCatalog("https://x402.example.com/");
    expect(catalog.baseUrl).toBe("https://x402.example.com");
    expect(catalog.paymentEndpoint).toBe("https://x402.example.com/pay");
    expect(catalog.countries).toEqual(["DE", "US"]);
    expect(catalog.plans).toEqual([
      { id: "PREMIUMX1", price_usd: 1.0, duration_minutes: 60 },
      { id: "PREMIUMX3", price_usd: 3.0, duration_minutes: 180 },
    ]);
    expect(fetch).toHaveBeenCalledWith(
      "https://x402.example.com/.well-known/x402-payment",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 503,
        json: async () => ({ error: "unavailable" }),
      })),
    );
    await expect(fetchVpnCatalog("https://x402.example.com")).rejects.toThrow(/503/);
  });
});
