import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";
import type { PayerConfig } from "../types.js";
import { loadSolanaKeypair } from "../chains/solana.js";

export function walletStatus(config: PayerConfig): Record<string, unknown> {
  const out: Record<string, unknown> = {
    baseUrl: config.baseUrl,
    preferredNetwork: config.preferredNetwork,
    solanaConfigured: Boolean(config.solanaPrivateKey),
    evmConfigured: Boolean(config.evmPrivateKey),
  };
  if (config.solanaPrivateKey) {
    try {
      out.solanaAddress = loadSolanaKeypair(config.solanaPrivateKey).publicKey.toBase58();
    } catch {
      out.solanaAddressError = "invalid SOLANA_PRIVATE_KEY";
    }
  }
  if (config.evmPrivateKey) {
    try {
      out.evmAddress = privateKeyToAccount(config.evmPrivateKey as Hex).address;
    } catch {
      out.evmAddressError = "invalid EVM_PRIVATE_KEY";
    }
  }
  return out;
}
