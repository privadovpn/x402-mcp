import type { PayerConfig, PaymentAccept } from "./types.js";

function isSolana(n: string): boolean {
  return n.startsWith("solana:");
}
function isEvm(n: string): boolean {
  return n.startsWith("eip155:");
}

export function canPay(accept: PaymentAccept, cfg: PayerConfig): boolean {
  if (isSolana(accept.network)) return Boolean(cfg.solanaPrivateKey);
  if (isEvm(accept.network)) return Boolean(cfg.evmPrivateKey);
  return false;
}

export function pickAccept(
  accepts: PaymentAccept[],
  cfg: PayerConfig,
  forcedNetwork?: string,
): PaymentAccept {
  const payable = accepts.filter((a) => canPay(a, cfg));
  if (forcedNetwork) {
    const match = payable.find((a) => a.network === forcedNetwork);
    if (!match) {
      throw new Error(
        `No payable accept for network ${forcedNetwork}. Payable: ${payable.map((a) => a.network).join(", ") || "none"}`,
      );
    }
    return match;
  }

  const solana = payable.filter((a) => isSolana(a.network));
  const evm = payable.filter((a) => isEvm(a.network));

  if (cfg.preferredNetwork === "solana" && solana[0]) return solana[0];
  if (cfg.preferredNetwork === "evm" && evm[0]) return evm[0];
  if (solana[0]) return solana[0];
  if (evm[0]) return evm[0];

  throw new Error(
    `No payable accept in quote (need matching SOLANA_PRIVATE_KEY or EVM_PRIVATE_KEY). Networks offered: ${accepts.map((a) => a.network).join(", ") || "none"}`,
  );
}
