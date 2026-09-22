import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

export function saveCredentials(
  plan: string,
  result: Record<string, unknown>,
  homeDir: string = homedir(),
): string {
  const outDir = resolve(homeDir, ".privado");
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, `vpn-${plan.toLowerCase()}-${Date.now()}.json`);
  writeFileSync(outFile, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return outFile;
}
