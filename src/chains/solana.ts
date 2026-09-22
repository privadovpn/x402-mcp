import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import type { PaymentAccept } from "../types.js";

export const USDC_DECIMALS = 6;

export function loadSolanaKeypair(secret: string): Keypair {
  const bytes = bs58.decode(secret.trim());
  if (bytes.length === 64) {
    return Keypair.fromSecretKey(bytes);
  }
  if (bytes.length === 32) {
    return Keypair.fromSeed(bytes);
  }
  throw new Error("SOLANA_PRIVATE_KEY must decode to 32 or 64 bytes (base58)");
}

async function assertBalances(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  requiredUsdc: bigint,
): Promise<void> {
  const solBalance = await connection.getBalance(payer, "confirmed");
  if (solBalance < 5_000) {
    throw new Error(`Insufficient SOL for fees: ${solBalance} lamports (need at least ~5000)`);
  }

  const ata = await getAssociatedTokenAddress(mint, payer, false, TOKEN_PROGRAM_ID);
  const account = await connection.getTokenAccountBalance(ata, "confirmed").catch(() => null);
  if (!account) {
    throw new Error(`No USDC token account for ${payer.toBase58()} (mint ${mint.toBase58()})`);
  }

  const balance = BigInt(account.value.amount);
  if (balance < requiredUsdc) {
    const have = Number(balance) / 10 ** USDC_DECIMALS;
    const need = Number(requiredUsdc) / 10 ** USDC_DECIMALS;
    throw new Error(`Insufficient USDC: have ${have}, need ${need}`);
  }
}

export async function assertSolanaBalances(args: {
  rpcUrl: string;
  secret: string;
  accept: PaymentAccept;
}): Promise<void> {
  const connection = new Connection(args.rpcUrl, "confirmed");
  const keypair = loadSolanaKeypair(args.secret);
  const mint = new PublicKey(args.accept.asset);
  const amount = BigInt(args.accept.amount);
  await assertBalances(connection, keypair.publicKey, mint, amount);
}

async function payAndBroadcast(
  connection: Connection,
  keypair: Keypair,
  accept: PaymentAccept,
): Promise<{ signature: string; transactionB64: string }> {
  const mint = new PublicKey(accept.asset);
  const payTo = new PublicKey(accept.payTo);
  const amount = BigInt(accept.amount);
  const payer = keypair.publicKey;

  await assertBalances(connection, payer, mint, amount);

  const sourceAta = await getAssociatedTokenAddress(mint, payer, false, TOKEN_PROGRAM_ID);
  const destAta = await getAssociatedTokenAddress(mint, payTo, false, TOKEN_PROGRAM_ID);
  const destAtaInfo = await connection.getAccountInfo(destAta, "confirmed");

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

  const instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: destAtaInfo ? 40_000 : 80_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5 }),
  ];

  if (!destAtaInfo) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        payer,
        destAta,
        payTo,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }

  instructions.push(
    createTransferCheckedInstruction(
      sourceAta,
      mint,
      destAta,
      payer,
      amount,
      USDC_DECIMALS,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(message);
  transaction.sign([keypair]);

  const transactionB64 = Buffer.from(transaction.serialize()).toString("base64");
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

  return { signature, transactionB64 };
}

export async function paySolana(args: {
  rpcUrl: string;
  secret: string;
  accept: PaymentAccept;
}): Promise<{ signature: string; transactionB64: string }> {
  const connection = new Connection(args.rpcUrl, "confirmed");
  const keypair = loadSolanaKeypair(args.secret);
  return payAndBroadcast(connection, keypair, args.accept);
}
