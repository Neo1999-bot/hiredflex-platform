import { describe, expect, it, vi } from "vitest";
import { execFile } from "node:child_process";
import type { Sql } from "postgres";
import { verifyDisposableBackupRestore } from "../scripts/verify-backup-restore.js";

vi.mock("node:child_process", () => ({ execFile: vi.fn() }));

describe("disposable backup/restore boundary", () => {
  it.each([
    { sourceName: "neondb" },
    { sourceName: "hiredflex-production" },
    { sourceName: "hiredflex_verify_invalid" },
    { containerId: "--privileged" },
    { containerId: "postgres; echo unsafe" },
    { sourceUrl: "postgres://test:synthetic@localhost/neondb" },
  ])(
    "rejects non-verifier targets or unsafe container arguments before SQL: %j",
    async (patch) => {
      const source = vi.fn();
      const admin = vi.fn();
      await expect(
        verifyDisposableBackupRestore({
          sourceName: "hiredflex_verify_" + "a".repeat(32),
          containerId: "b".repeat(64),
          sourceUrl:
            "postgres://test:synthetic@localhost/hiredflex_verify_" +
            "a".repeat(32),
          source: source as unknown as Sql,
          admin: admin as unknown as Sql,
          ...patch,
        }),
      ).rejects.toThrow();
      expect(source).not.toHaveBeenCalled();
      expect(admin).not.toHaveBeenCalled();
      expect(execFile).not.toHaveBeenCalled();
    },
  );
});
