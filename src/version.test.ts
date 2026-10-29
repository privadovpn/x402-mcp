import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getPackageVersion } from "./version.js";

describe("getPackageVersion", () => {
  it("returns the version from package.json, not a hardcoded string", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
      version: string;
    };

    const version = getPackageVersion();

    expect(version).toBe(pkg.version);
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
