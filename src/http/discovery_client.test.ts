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

  it("parses an expanded six-plan catalog without any client-side plan allowlist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          x402Version: 2,
          paymentEndpoint: "https://x402.example.com/pay",
          settlementMode: "payer-submits",
          countries: ["US"],
          resources: [
            {
              plans: [
                { id: "PREMIUMM15", price_usd: 0.05, duration_minutes: 15 },
                { id: "PREMIUMX1", price_usd: 0.15, duration_minutes: 60 },
                { id: "PREMIUMX3", price_usd: 0.39, duration_minutes: 180 },
                { id: "PREMIUMD1", price_usd: 0.99, duration_minutes: 1440 },
                { id: "PREMIUMD7", price_usd: 2.99, duration_minutes: 10080 },
                { id: "PREMIUMD30", price_usd: 5.99, duration_minutes: 43200 },
              ],
            },
          ],
        }),
      })),
    );

    const catalog = await fetchVpnCatalog("https://x402.example.com");
    expect(catalog.plans).toHaveLength(6);
    expect(catalog.plans.map((p) => p.id)).toEqual([
      "PREMIUMM15",
      "PREMIUMX1",
      "PREMIUMX3",
      "PREMIUMD1",
      "PREMIUMD7",
      "PREMIUMD30",
    ]);
    expect(catalog.plans[0]).toEqual({
      id: "PREMIUMM15",
      price_usd: 0.05,
      duration_minutes: 15,
    });
  });

  it("parses per-plan services and port when the backend includes them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          x402Version: 2,
          paymentEndpoint: "https://x402.example.com/pay",
          settlementMode: "payer-submits",
          countries: ["US"],
          resources: [
            {
              plans: [
                {
                  id: "PREMIUMM15",
                  price_usd: 0.05,
                  duration_minutes: 15,
                  services: ["http_proxy", "socks5_proxy"],
                  port: 3128,
                },
              ],
            },
          ],
        }),
      })),
    );

    const catalog = await fetchVpnCatalog("https://x402.example.com");
    expect(catalog.plans[0].services).toEqual(["http_proxy", "socks5_proxy"]);
    expect(catalog.plans[0].port).toBe(3128);
  });

  it("omits services/port when the backend doesn't send them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          x402Version: 2,
          paymentEndpoint: "https://x402.example.com/pay",
          settlementMode: "payer-submits",
          countries: ["US"],
          resources: [
            {
              plans: [{ id: "PREMIUMX1", price_usd: 0.15, duration_minutes: 60 }],
            },
          ],
        }),
      })),
    );

    const catalog = await fetchVpnCatalog("https://x402.example.com");
    expect(catalog.plans[0].services).toBeUndefined();
    expect(catalog.plans[0].port).toBeUndefined();
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
