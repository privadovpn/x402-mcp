import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function getPackageVersion(): string {
  const dir = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(resolve(dir, "../package.json"), "utf8")) as {
    version: string;
  };
  return pkg.version;
}
