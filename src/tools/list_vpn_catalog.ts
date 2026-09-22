import {
  fetchVpnCatalog,
  type VpnCatalog,
} from "../http/discovery_client.js";
import type { PayerConfig } from "../types.js";

export interface ListVpnCatalogDeps {
  fetchVpnCatalog: typeof fetchVpnCatalog;
}

const defaultDeps: ListVpnCatalogDeps = {
  fetchVpnCatalog,
};

export async function listVpnCatalog(args: {
  config: PayerConfig;
  deps?: Partial<ListVpnCatalogDeps>;
}): Promise<VpnCatalog> {
  const deps = { ...defaultDeps, ...args.deps };
  return deps.fetchVpnCatalog(args.config.baseUrl);
}
