import { saveCredentials as defaultSave } from "../credentials.js";
import { fetchQuote as defaultQuote, fulfillPayment as defaultFulfill } from "../http/pay_client.js";
import type { PayerConfig } from "../types.js";
import { signAndPay as defaultSignAndPay } from "./sign_and_pay.js";

export interface BuyVpnDeps {
  fetchQuote: typeof defaultQuote;
  fulfillPayment: typeof defaultFulfill;
  signAndPay: typeof defaultSignAndPay;
  saveCredentials: typeof defaultSave;
}

const defaultDeps: BuyVpnDeps = {
  fetchQuote: defaultQuote,
  fulfillPayment: defaultFulfill,
  signAndPay: defaultSignAndPay,
  saveCredentials: defaultSave,
};

export async function buyVpn(args: {
  plan: string;
  country?: string;
  dryRun?: boolean;
  network?: string;
  config: PayerConfig;
  deps?: Partial<BuyVpnDeps>;
}): Promise<Record<string, unknown>> {
  const deps = { ...defaultDeps, ...args.deps };
  const plan = args.plan.toUpperCase();
  const quote = await deps.fetchQuote(args.config.baseUrl, plan, args.country);
  if (quote.status !== 402) {
    throw new Error(`Expected HTTP 402 quote, got ${quote.status}: ${JSON.stringify(quote.body)}`);
  }

  const invoiceNo =
    quote.paymentRequired.accepts[0]?.invoiceNo ?? quote.paymentRequired.invoice_no;
  if (!invoiceNo?.trim()) {
    throw new Error("Quote missing invoice_no / accepts[].invoiceNo; refusing to pay");
  }

  if (args.dryRun) {
    const preview = await deps.signAndPay({
      accepts: quote.paymentRequired.accepts,
      config: args.config,
      dryRun: true,
      network: args.network,
    });
    return {
      dry_run: true,
      invoice_no: invoiceNo,
      warning:
        "dry_run created a real invoice on the server. Do NOT call buy_vpn again for this purchase attempt — that creates a new invoice. For a real purchase, call buy_vpn once with dry_run=false (or omit dry_run).",
      ...preview,
    };
  }

  const paid = (await deps.signAndPay({
    accepts: quote.paymentRequired.accepts,
    config: args.config,
    network: args.network,
  })) as {
    payment_signature: string;
    settlement_tx: string;
    network: string;
    invoiceNo?: string;
  };

  const resolvedInvoice = paid.invoiceNo ?? invoiceNo;

  try {
    const fulfilled = await deps.fulfillPayment({
      baseUrl: args.config.baseUrl,
      plan,
      invoiceNo: resolvedInvoice,
      paymentSignature: paid.payment_signature,
      settlementTx: paid.settlement_tx,
      country: args.country,
    });

    const credentials_path = deps.saveCredentials(plan, fulfilled);
    return {
      ...fulfilled,
      invoice_no: resolvedInvoice,
      settlement_tx: paid.settlement_tx,
      network: paid.network,
      credentials_path,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      [
        "On-chain payment succeeded but fulfill failed.",
        "DO NOT call buy_vpn again (that creates a new invoice and will charge again).",
        "Call fulfill_payment with these exact values:",
        JSON.stringify(
          {
            plan,
            invoice_no: resolvedInvoice,
            payment_signature: paid.payment_signature,
            settlement_tx: paid.settlement_tx,
            country: args.country ?? null,
          },
          null,
          2,
        ),
        `Original error: ${message}`,
      ].join("\n"),
    );
  }
}
