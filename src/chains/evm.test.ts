import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { buildEip3009Authorization } from "./evm.js";
import type { PaymentAccept } from "../types.js";

const PRIV =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

describe("buildEip3009Authorization", () => {
  it("signs transferWithAuthorization typed data", async () => {
    const account = privateKeyToAccount(PRIV);
    const accept: PaymentAccept = {
      scheme: "exact",
      network: "eip155:137",
      amount: "1000000",
      asset: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      payTo: "0x2222222222222222222222222222222222222222",
      maxTimeoutSeconds: 600,
      extra: { name: "USD Coin", version: "2" },
    };
    const built = await buildEip3009Authorization({
      privateKey: PRIV,
      accept,
      nowSeconds: 1_700_000_000,
    });
    expect(built.authorization.from.toLowerCase()).toBe(account.address.toLowerCase());
    expect(built.authorization.to.toLowerCase()).toBe(accept.payTo.toLowerCase());
    expect(built.authorization.value).toBe("1000000");
    expect(built.signature.startsWith("0x")).toBe(true);
    expect(built.authorization.nonce.startsWith("0x")).toBe(true);
  });
});
