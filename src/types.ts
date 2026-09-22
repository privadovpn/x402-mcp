export interface PaymentAccept {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, string>;
  invoiceNo?: string;
  settlementMode?: string;
}

export interface PaymentRequired {
  x402Version: number;
  invoice_no: string;
  accepts: PaymentAccept[];
  resource?: { plan?: string; expires_at?: string };
}

export type PreferredNetwork = "solana" | "evm";

export interface PayerConfig {
  baseUrl: string;
  preferredNetwork: PreferredNetwork;
  solanaPrivateKey?: string;
  evmPrivateKey?: string;
  solanaRpcUrl: string;
  evmRpcUrl?: string;
}

export interface SignAndPayResult {
  payment_signature: string;
  settlement_tx: string;
  network: string;
  amount: string;
  payTo: string;
  invoiceNo?: string;
}
