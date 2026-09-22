import { pickAccept } from "../accept.js";
import { assertSolanaBalances, paySolana } from "../chains/solana.js";
import { assertEvmBalances, payEvm } from "../chains/evm.js";
import {
  buildEvmPaymentSignature,
  buildSolanaPaymentSignature,
} from "../payment_signature.js";
import type { PayerConfig, PaymentAccept, SignAndPayResult } from "../types.js";

export async function signAndPay(args: {
  accepts: PaymentAccept[];
  config: PayerConfig;
  dryRun?: boolean;
  network?: string;
}): Promise<SignAndPayResult | (SignAndPayResult & { dry_run: true }) | Record<string, unknown>> {
  const accept = pickAccept(args.accepts, args.config, args.network);

  if (accept.network.startsWith("solana:")) {
    if (args.dryRun) {
      await assertSolanaBalances({
        rpcUrl: args.config.solanaRpcUrl,
        secret: args.config.solanaPrivateKey!,
        accept,
      });
      return {
        dry_run: true,
        network: accept.network,
        amount: accept.amount,
        payTo: accept.payTo,
        invoiceNo: accept.invoiceNo,
      };
    }
    const { signature, transactionB64 } = await paySolana({
      rpcUrl: args.config.solanaRpcUrl,
      secret: args.config.solanaPrivateKey!,
      accept,
    });
    return {
      payment_signature: buildSolanaPaymentSignature(accept, transactionB64),
      settlement_tx: signature,
      network: accept.network,
      amount: accept.amount,
      payTo: accept.payTo,
      invoiceNo: accept.invoiceNo,
    };
  }

  if (accept.network.startsWith("eip155:")) {
    if (!args.config.evmRpcUrl) {
      throw new Error("EVM_RPC_URL is required for EVM payments");
    }
    if (args.dryRun) {
      await assertEvmBalances({
        privateKey: args.config.evmPrivateKey!,
        rpcUrl: args.config.evmRpcUrl,
        accept,
      });
      return {
        dry_run: true,
        network: accept.network,
        amount: accept.amount,
        payTo: accept.payTo,
        invoiceNo: accept.invoiceNo,
      };
    }
    const { settlementTx, paymentPayload } = await payEvm({
      privateKey: args.config.evmPrivateKey!,
      rpcUrl: args.config.evmRpcUrl,
      accept,
    });
    return {
      payment_signature: buildEvmPaymentSignature(accept, paymentPayload),
      settlement_tx: settlementTx,
      network: accept.network,
      amount: accept.amount,
      payTo: accept.payTo,
      invoiceNo: accept.invoiceNo,
    };
  }

  throw new Error(`Unsupported network: ${accept.network}`);
}
