import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

const KEYS = [
  "X402_BASE_URL",
  "SOLANA_PRIVATE_KEY",
  "EVM_PRIVATE_KEY",
  "PREFERRED_NETWORK",
  "SOLANA_RPC_URL",
  "EVM_RPC_URL",
] as const;

afterEach(() => {
  for (const k of KEYS) delete process.env[k];
});

describe("loadConfig", () => {
  it("defaults base URL and preferred network", () => {
    process.env.SOLANA_PRIVATE_KEY = "dummy";
    const cfg = loadConfig(process.env);
    expect(cfg.baseUrl).toBe("https://x402.privadovpn.com");
    expect(cfg.preferredNetwork).toBe("solana");
  });

  it("strips trailing slash from base URL", () => {
    process.env.SOLANA_PRIVATE_KEY = "dummy";
    process.env.X402_BASE_URL = "https://x402.privadovpn.com/";
    expect(loadConfig(process.env).baseUrl).toBe("https://x402.privadovpn.com");
  });

  it("throws when neither key is set", () => {
    expect(() => loadConfig(process.env)).toThrow(/SOLANA_PRIVATE_KEY|EVM_PRIVATE_KEY/);
  });

  it("allows EVM-only", () => {
    process.env.EVM_PRIVATE_KEY = "0xabc";
    const cfg = loadConfig(process.env);
    expect(cfg.evmPrivateKey).toBe("0xabc");
    expect(cfg.solanaPrivateKey).toBeUndefined();
    expect(cfg.preferredNetwork).toBe("evm");
  });

  it("throws on invalid PREFERRED_NETWORK", () => {
    process.env.SOLANA_PRIVATE_KEY = "dummy";
    process.env.PREFERRED_NETWORK = "bitcoin";
    expect(() => loadConfig(process.env)).toThrow(
      /PREFERRED_NETWORK must be 'solana' or 'evm'/,
    );
  });

  it("accepts eip155 as alias for evm", () => {
    process.env.EVM_PRIVATE_KEY = "0xabc";
    process.env.PREFERRED_NETWORK = "eip155";
    expect(loadConfig(process.env).preferredNetwork).toBe("evm");
  });
});
