import { describe, expect, it } from "vitest";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { loadSolanaKeypair } from "./solana.js";

describe("loadSolanaKeypair", () => {
  it("loads 64-byte secret", () => {
    const kp = Keypair.generate();
    const encoded = bs58.encode(kp.secretKey);
    const loaded = loadSolanaKeypair(encoded);
    expect(loaded.publicKey.toBase58()).toBe(kp.publicKey.toBase58());
  });

  it("loads 32-byte seed", () => {
    const seed = Keypair.generate().secretKey.slice(0, 32);
    const encoded = bs58.encode(seed);
    const loaded = loadSolanaKeypair(encoded);
    expect(loaded.publicKey.toBase58()).toBeTruthy();
  });

  it("rejects bad length", () => {
    expect(() => loadSolanaKeypair(bs58.encode(Buffer.from("short")))).toThrow(/32 or 64/);
  });
});
