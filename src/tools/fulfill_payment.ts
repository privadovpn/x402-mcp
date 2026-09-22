import { saveCredentials as defaultSave } from "../credentials.js";
import { fulfillPayment as defaultFulfill } from "../http/pay_client.js";
import type { PayerConfig } from "../types.js";

export interface FulfillPaymentDeps {
  fulfillPayment: typeof defaultFulfill;
  saveCredentials: typeof defaultSave;
}

const defaultDeps: FulfillPaymentDeps = {
  fulfillPayment: defaultFulfill,
  saveCredentials: defaultSave,
};

/**
 * Complete a purchase after on-chain payment already succeeded.
 * Use when buy_vpn paid but fulfill failed — never call buy_vpn again.
 */
export async function fulfillVpnPayment(args: {
  plan: string;
  invoiceNo: string;
  paymentSignature: string;
  settlementTx: string;
  country?: string;
  config: PayerConfig;
  deps?: Partial<FulfillPaymentDeps>;
}): Promise<Record<string, unknown>> {
  const deps = { ...defaultDeps, ...args.deps };
  const plan = args.plan.toUpperCase();
  const invoiceNo = args.invoiceNo.trim();
  if (!invoiceNo) {
    throw new Error("invoice_no is required");
  }
  if (!args.paymentSignature?.trim()) {
    throw new Error("payment_signature is required");
  }
  if (!args.settlementTx?.trim()) {
    throw new Error("settlement_tx is required");
  }

  const fulfilled = await deps.fulfillPayment({
    baseUrl: args.config.baseUrl,
    plan,
    invoiceNo,
    paymentSignature: args.paymentSignature,
    settlementTx: args.settlementTx,
    country: args.country,
  });

  const credentials_path = deps.saveCredentials(plan, fulfilled);
  return {
    ...fulfilled,
    invoice_no: invoiceNo,
    settlement_tx: args.settlementTx,
    credentials_path,
  };
}
