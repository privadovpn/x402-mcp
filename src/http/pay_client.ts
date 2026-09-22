import type { PaymentRequired } from "../types.js";

export interface QuoteResult {
  status: number;
  body: Record<string, unknown>;
  paymentRequired: PaymentRequired;
}

export async function fetchQuote(
  baseUrl: string,
  plan: string,
  country?: string,
): Promise<QuoteResult> {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/pay`);
  url.searchParams.set("plan", plan);
  if (country) url.searchParams.set("country", country);

  const response = await fetch(url.toString(), { method: "GET" });
  const body = (await response.json()) as Record<string, unknown>;
  const paymentRequiredHeader = response.headers.get("PAYMENT-REQUIRED");
  if (!paymentRequiredHeader) {
    throw new Error(`Missing PAYMENT-REQUIRED header (HTTP ${response.status})`);
  }
  const paymentRequired = JSON.parse(
    Buffer.from(paymentRequiredHeader, "base64").toString("utf8"),
  ) as PaymentRequired;
  return { status: response.status, body, paymentRequired };
}

export async function fulfillPayment(args: {
  baseUrl: string;
  plan: string;
  invoiceNo: string;
  paymentSignature: string;
  settlementTx: string;
  country?: string;
}): Promise<Record<string, unknown>> {
  const url = new URL(`${args.baseUrl.replace(/\/$/, "")}/pay`);
  url.searchParams.set("plan", args.plan);
  url.searchParams.set("invoice_no", args.invoiceNo);
  if (args.country) url.searchParams.set("country", args.country);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "PAYMENT-SIGNATURE": args.paymentSignature,
      "X-Settlement-Transaction": args.settlementTx,
    },
  });
  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`Fulfill failed (HTTP ${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}
