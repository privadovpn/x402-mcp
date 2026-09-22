import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { EvmAuthPayload } from "../payment_signature.js";
import type { PaymentAccept } from "../types.js";

const eip3009Abi = parseAbi([
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)",
]);

const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
]);

function chainIdFromNetwork(network: string): number {
  const m = /^eip155:(\d+)$/.exec(network);
  if (!m) throw new Error(`Unsupported EVM network: ${network}`);
  return Number(m[1]);
}

export async function buildEip3009Authorization(args: {
  privateKey: string;
  accept: PaymentAccept;
  nowSeconds?: number;
}): Promise<EvmAuthPayload> {
  const account = privateKeyToAccount(args.privateKey as Hex);
  const chainId = chainIdFromNetwork(args.accept.network);
  const name = args.accept.extra?.name || "USD Coin";
  const version = args.accept.extra?.version || "2";
  const now = args.nowSeconds ?? Math.floor(Date.now() / 1000);
  const validAfter = 0n;
  const validBefore = BigInt(now + args.accept.maxTimeoutSeconds);
  const nonce = (`0x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex")}`) as Hex;

  const signature = await account.signTypedData({
    domain: {
      name,
      version,
      chainId,
      verifyingContract: args.accept.asset as Hex,
    },
    types: {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
    message: {
      from: account.address,
      to: args.accept.payTo as Hex,
      value: BigInt(args.accept.amount),
      validAfter,
      validBefore,
      nonce,
    },
  });

  return {
    signature,
    authorization: {
      from: account.address,
      to: args.accept.payTo,
      value: args.accept.amount,
      validAfter: validAfter.toString(),
      validBefore: validBefore.toString(),
      nonce,
    },
  };
}

export async function assertEvmBalances(args: {
  privateKey: string;
  rpcUrl: string;
  accept: PaymentAccept;
}): Promise<void> {
  const account = privateKeyToAccount(args.privateKey as Hex);
  const publicClient = createPublicClient({ transport: http(args.rpcUrl) });
  const required = BigInt(args.accept.amount);

  const nativeBalance = await publicClient.getBalance({ address: account.address });
  if (nativeBalance === 0n) {
    throw new Error(
      `Insufficient native balance for gas: ${account.address} has 0 (need > 0)`,
    );
  }

  const tokenBalance = await publicClient.readContract({
    address: args.accept.asset as Hex,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });

  if (tokenBalance < required) {
    throw new Error(
      `Insufficient ERC20 balance: have ${tokenBalance}, need ${required}`,
    );
  }
}

export async function payEvm(args: {
  privateKey: string;
  rpcUrl: string;
  accept: PaymentAccept;
}): Promise<{ settlementTx: string; paymentPayload: EvmAuthPayload }> {
  if (!args.rpcUrl) {
    throw new Error("EVM_RPC_URL is required for EVM payments");
  }

  await assertEvmBalances({
    privateKey: args.privateKey,
    rpcUrl: args.rpcUrl,
    accept: args.accept,
  });

  const payload = await buildEip3009Authorization({
    privateKey: args.privateKey,
    accept: args.accept,
  });
  const account = privateKeyToAccount(args.privateKey as Hex);
  const chainId = chainIdFromNetwork(args.accept.network);
  const publicClient = createPublicClient({ transport: http(args.rpcUrl) });
  const walletClient = createWalletClient({
    account,
    transport: http(args.rpcUrl),
  });

  const sig = payload.signature as Hex;
  const r = `0x${sig.slice(2, 66)}` as Hex;
  const s = `0x${sig.slice(66, 130)}` as Hex;
  const v = Number.parseInt(sig.slice(130, 132), 16);

  const hash = await walletClient.writeContract({
    address: args.accept.asset as Hex,
    abi: eip3009Abi,
    functionName: "transferWithAuthorization",
    args: [
      payload.authorization.from as Hex,
      payload.authorization.to as Hex,
      BigInt(payload.authorization.value),
      BigInt(payload.authorization.validAfter),
      BigInt(payload.authorization.validBefore),
      payload.authorization.nonce as Hex,
      v,
      r,
      s,
    ],
    chain: {
      id: chainId,
      name: `eip155:${chainId}`,
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [args.rpcUrl] } },
    },
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return { settlementTx: hash, paymentPayload: payload };
}
