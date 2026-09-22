export interface DiscoveryPlan {
  id: string;
  price_usd: number;
  duration_minutes: number;
}

export interface VpnCatalog {
  baseUrl: string;
  paymentEndpoint: string;
  settlementMode: string;
  plans: DiscoveryPlan[];
  countries: string[];
}

export async function fetchVpnCatalog(baseUrl: string): Promise<VpnCatalog> {
  const root = baseUrl.replace(/\/$/, "");
  const url = `${root}/.well-known/x402-payment`;
  const response = await fetch(url, { method: "GET" });
  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      `Catalog fetch failed (HTTP ${response.status}): ${JSON.stringify(body)}`,
    );
  }

  const resources = body.resources as Array<Record<string, unknown>> | undefined;
  const plansRaw = (resources?.[0]?.plans ?? []) as Array<Record<string, unknown>>;
  const plans: DiscoveryPlan[] = plansRaw.map((p) => ({
    id: String(p.id),
    price_usd: Number(p.price_usd),
    duration_minutes: Number(p.duration_minutes),
  }));

  const countries = Array.isArray(body.countries)
    ? (body.countries as unknown[]).map((c) => String(c).toUpperCase()).sort()
    : [];

  return {
    baseUrl: root,
    paymentEndpoint: String(body.paymentEndpoint ?? `${root}/pay`),
    settlementMode: String(body.settlementMode ?? "payer-submits"),
    plans,
    countries,
  };
}
