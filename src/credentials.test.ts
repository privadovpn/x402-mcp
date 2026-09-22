import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { saveCredentials } from "./credentials.js";

describe("saveCredentials", () => {
  it("writes vpn json under homeDir/.privado", () => {
    const home = mkdtempSync(join(tmpdir(), "privado-cred-"));
    try {
      const path = saveCredentials("PREMIUMX1", { vpn: { username: "u", password: "p" } }, home);
      expect(path).toContain(".privado");
      expect(path).toContain("vpn-premiumx1-");
      const parsed = JSON.parse(readFileSync(path, "utf8"));
      expect(parsed.vpn.username).toBe("u");
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });
});
