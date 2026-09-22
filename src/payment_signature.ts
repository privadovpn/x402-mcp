import type { PaymentAccept } from "./types.js";

function acceptedEnvelope(accept: PaymentAccept) {
  return {
    scheme: accept.scheme,
    network: accept.network,
    amount: accept.amount,
    asset: accept.asset,
    payTo: accept.payTo,
    maxTimeoutSeconds: accept.maxTimeoutSeconds,
    ...(accept.extra ? { extra: accept.extra } : {}),
    ...(accept.invoiceNo ? { invoiceNo: accept.invoiceNo } : {}),
    ...(accept.settlementMode ? { settlementMode: accept.settlementMode } : {}),
  };
}

function toBase64(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

export function buildSolanaPaymentSignature(
  accept: PaymentAccept,
  transactionB64: string,
): string {
  return toBase64({
    x402Version: 2,
    scheme: "exact",
    network: accept.network,
    accepted: acceptedEnvelope(accept),
    payload: { transaction: transactionB64 },
  });
}

export interface EvmAuthPayload {
  signature: string;
  authorization: {
    from: string;
    to: string;
    value: string;
    validAfter: string;
    validBefore: string;
    nonce: string;
  };
}

export function buildEvmPaymentSignature(
  accept: PaymentAccept,
  payload: EvmAuthPayload,
): string {
  return toBase64({
    x402Version: 2,
    scheme: "exact",
    network: accept.network,
    accepted: acceptedEnvelope(accept),
    payload,
  });
}
