#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig } from "./config.js";
import { buyVpn } from "./tools/buy_vpn.js";
import { fulfillVpnPayment } from "./tools/fulfill_payment.js";
import { listVpnCatalog } from "./tools/list_vpn_catalog.js";
import { signAndPay } from "./tools/sign_and_pay.js";
import { walletStatus } from "./tools/wallet_status.js";
import type { PaymentAccept } from "./types.js";

const PaymentAcceptSchema = z.object({
  scheme: z.string(),
  network: z.string(),
  amount: z.string(),
  asset: z.string(),
  payTo: z.string(),
  maxTimeoutSeconds: z.number(),
  extra: z.record(z.string()).optional(),
  invoiceNo: z.string().optional(),
  settlementMode: z.string().optional(),
});

async function main(): Promise<void> {
  const config = loadConfig();
  const server = new McpServer({ name: "privadovpn-x402-mcp", version: "1.0.0" });

  server.tool(
    "wallet_status",
    "Show which wallets are configured (addresses only, never private keys).",
    {},
    async () => ({
      content: [{ type: "text", text: JSON.stringify(walletStatus(config), null, 2) }],
    }),
  );

  server.tool(
    "list_vpn_catalog",
    "List purchasable VPN plans (id, USD price, duration) and supported server country codes from X402_BASE_URL discovery.",
    {},
    async () => ({
      content: [{ type: "text", text: JSON.stringify(await listVpnCatalog({ config }), null, 2) }],
    }),
  );

  server.tool(
    "sign_and_pay",
    "DEBUG ONLY. Broadcasts on-chain payment and returns payment_signature + settlement_tx but does NOT fetch VPN credentials. Prefer buy_vpn. If you use this, you MUST next call fulfill_payment with the same invoice_no — never curl /pay and never call buy_vpn again (double charge).",
    {
      accepts: z.array(PaymentAcceptSchema),
      dry_run: z.boolean().optional(),
      network: z.string().optional(),
    },
    async ({ accepts, dry_run, network }) => {
      const result = await signAndPay({
        accepts: accepts as PaymentAccept[],
        config,
        dryRun: dry_run,
        network,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "buy_vpn",
    "PREFERRED. Buy VPN in one call: quote → pay on-chain → fulfill → save credentials. Call ONCE per purchase. Do not use curl/shell against /pay. Do not call dry_run then buy again (each quote creates a new invoice). If this errors after payment, call fulfill_payment with the recovery fields from the error — never retry buy_vpn.",
    {
      plan: z.string(),
      country: z.string().optional(),
      dry_run: z.boolean().optional(),
      network: z.string().optional(),
    },
    async ({ plan, country, dry_run, network }) => {
      const result = await buyVpn({
        plan,
        country,
        dryRun: dry_run,
        network,
        config,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "fulfill_payment",
    "Recovery only: exchange an already-broadcast payment for VPN credentials. Requires plan, invoice_no, payment_signature, settlement_tx from a prior buy_vpn/sign_and_pay. Does not create a new invoice or send money. Use when fulfill failed after payment — never call buy_vpn again.",
    {
      plan: z.string(),
      invoice_no: z.string(),
      payment_signature: z.string(),
      settlement_tx: z.string(),
      country: z.string().optional(),
    },
    async ({ plan, invoice_no, payment_signature, settlement_tx, country }) => {
      const result = await fulfillVpnPayment({
        plan,
        invoiceNo: invoice_no,
        paymentSignature: payment_signature,
        settlementTx: settlement_tx,
        country,
        config,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`privadovpn-x402-mcp failed: ${message}`);
  process.exit(1);
});
