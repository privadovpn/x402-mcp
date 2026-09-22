import type { PayerConfig, PreferredNetwork } from "./types.js";

export function loadConfig(env: NodeJS.ProcessEnv = process.env): PayerConfig {
  const solanaPrivateKey = env.SOLANA_PRIVATE_KEY?.trim() || undefined;
  const evmPrivateKey = env.EVM_PRIVATE_KEY?.trim() || undefined;
  if (!solanaPrivateKey && !evmPrivateKey) {
    throw new Error(
      "Configure SOLANA_PRIVATE_KEY and/or EVM_PRIVATE_KEY in the MCP server env",
    );
  }

  const preferredRaw =
    env.PREFERRED_NETWORK?.trim().toLowerCase() ||
    (solanaPrivateKey ? "solana" : "evm");
  // Design docs sometimes say "eip155"; treat it as the EVM family alias.
  const preferred = preferredRaw === "eip155" ? "evm" : preferredRaw;
  if (preferred !== "solana" && preferred !== "evm") {
    throw new Error("PREFERRED_NETWORK must be 'solana' or 'evm' (eip155 alias ok)");
  }

  const baseUrl = (env.X402_BASE_URL?.trim() || "https://x402.privadovpn.com").replace(/\/$/, "");

  return {
    baseUrl,
    preferredNetwork: preferred as PreferredNetwork,
    solanaPrivateKey,
    evmPrivateKey,
    solanaRpcUrl: env.SOLANA_RPC_URL?.trim() || "https://api.mainnet-beta.solana.com",
    evmRpcUrl: env.EVM_RPC_URL?.trim() || undefined,
  };
}
