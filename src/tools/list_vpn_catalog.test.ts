import { describe, expect, it, vi } from "vitest";
import { listVpnCatalog } from "./list_vpn_catalog.js";
import type { PayerConfig } from "../types.js";

const cfg: PayerConfig = {
  baseUrl: "https://x402.example.com",
  preferredNetwork: "solana",
  solanaPrivateKey: "secret",
  solanaRpcUrl: "https://api.mainnet-beta.solana.com",
};

describe("listVpnCatalog", () => {
  it("returns plans and countries from discovery", async () => {
    const fetchVpnCatalog = vi.fn(async () => ({
      baseUrl: cfg.baseUrl,
      paymentEndpoint: `${cfg.baseUrl}/pay`,
      settlementMode: "payer-submits",
      plans: [{ id: "PREMIUMX1", price_usd: 1, duration_minutes: 60 }],
      countries: ["US"],
    }));

    const result = await listVpnCatalog({
      config: cfg,
      deps: { fetchVpnCatalog },
    });

    expect(fetchVpnCatalog).toHaveBeenCalledWith(cfg.baseUrl);
    expect(result.plans[0].id).toBe("PREMIUMX1");
    expect(result.countries).toEqual(["US"]);
  });
});
