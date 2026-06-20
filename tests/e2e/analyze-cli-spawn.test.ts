import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "../..");
const analyzeScript = join(projectRoot, "src/batch/analyze.ts");

function runAnalyzeCli(args: string[]): { stdout: string; stderr: string; status: number } {
  try {
    const stdout = execFileSync(
      "npx",
      ["tsx", analyzeScript, ...args],
      {
        cwd: projectRoot,
        encoding: "utf-8",
        env: {
          ...process.env,
          OPEN_EXCHANGE_RATES_APP_ID: "",
        },
      },
    );

    return { stdout, stderr: "", status: 0 };
  } catch (error) {
    const execError = error as {
      status?: number;
      stdout?: string;
      stderr?: string;
    };

    return {
      stdout: execError.stdout ?? "",
      stderr: execError.stderr ?? "",
      status: execError.status ?? 1,
    };
  }
}

describe("E2E: analyze.ts CLI process", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("prints help and exits with code 0", () => {
    const result = runAnalyzeCli(["--help"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Uso: analyze");
    expect(result.stdout).toContain("--mock");
  });

  it("runs offline against gastos-historicos.csv and writes markdown", () => {
    const dir = mkdtempSync(join(tmpdir(), "analyze-spawn-"));
    tempDirs.push(dir);

    const outputPath = join(dir, "report.md");

    const result = runAnalyzeCli([
      "--mock",
      "-d",
      "2026-06-19",
      "-i",
      join(projectRoot, "gastos-historicos.csv"),
      "-o",
      outputPath,
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("APROBADO:");
    expect(result.stdout).toContain(outputPath);

    const markdown = readFileSync(outputPath, "utf-8");
    expect(markdown).toContain("# Análisis de Gastos Históricos");
    expect(markdown).toContain("| APROBADO | 13 |");
    expect(markdown).toContain("Duplicados exactos (7 grupos)");
  });

  it("prints JSON report with --json-output", () => {
    const dir = mkdtempSync(join(tmpdir(), "analyze-spawn-"));
    tempDirs.push(dir);

    const jsonPath = join(dir, "report.json");

    const result = runAnalyzeCli([
      "--mock",
      "--json-output",
      jsonPath,
      "--no-write",
      "-d",
      "2026-06-19",
      "-i",
      join(projectRoot, "gastos-historicos.csv"),
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(jsonPath);

    const report = JSON.parse(readFileSync(jsonPath, "utf-8")) as {
      validRows: number;
      statusBreakdown: { APROBADO: number; PENDIENTE: number; RECHAZADO: number };
      referenceDate: string;
    };

    expect(report.validRows).toBe(50);
    expect(report.referenceDate).toBe("2026-06-19");
    expect(report.statusBreakdown).toEqual({
      APROBADO: 13,
      PENDIENTE: 13,
      RECHAZADO: 24,
    });
  });

  it("exits with code 1 when API key is missing without --mock", () => {
    const result = runAnalyzeCli([
      "-d",
      "2026-06-19",
      "-i",
      join(projectRoot, "gastos-historicos.csv"),
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("OPEN_EXCHANGE_RATES_APP_ID");
  });

  it("exits with code 2 for unknown flags", () => {
    const result = runAnalyzeCli(["--not-a-real-flag"]);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("Unknown option");
  });
});
