import { readFileSync } from "node:fs";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAnalyzeRateResolver,
  loadPolicyFromFile,
  mainAnalyze,
  parseAnalyzeArgs,
  renderAnalyzeHelp,
  runAnalyze,
  serializeBatchReport,
} from "../../../src/batch/analyzeCli.js";
import { MissingApiKeyError } from "../../../src/config/env.js";
import { defaultPolitica } from "../../../src/batch/policy.js";
import { referenceDate } from "../../fixtures.js";

const projectRootForFixtures = resolve(import.meta.dirname, "../../..");
const committedPolicyJson = readFileSync(
  join(projectRootForFixtures, "policy.json"),
  "utf-8",
);

const sampleCsv = `gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha
g_001,e_002,Bruno,Soto,sales_team,food,55,USD,2026-06-04
g_002,e_002,Bruno,Soto,sales_team,food,90,USD,2026-06-09
g_003,e_002,Bruno,Soto,sales_team,food,90,USD,2026-06-09
`;

const fallbackRatesJson = JSON.stringify({
  base: "USD",
  rates: { CLP: 900, MXN: 20, EUR: 0.92 },
});

function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), "analyze-cli-"));
}

describe("renderAnalyzeHelp", () => {
  it("documents the supported flags", () => {
    const help = renderAnalyzeHelp();

    expect(help).toContain("--mock");
    expect(help).toContain("--reference-date");
    expect(help).toContain("--policy");
    expect(help).toContain("--json");
    expect(help).toContain("--json-output");
    expect(help).toContain("--no-write");
  });
});

describe("parseAnalyzeArgs", () => {
  const projectRoot = "/project";

  it("uses defaults when no arguments are provided", () => {
    expect(parseAnalyzeArgs([], projectRoot)).toEqual({
      csvPath: "/project/gastos_historicos.csv",
      outputPath: "/project/ANALISIS.md",
      referenceDate: undefined,
      mockRates: false,
      policyPath: "/project/policy.json",
      fallbackRatesPath: "/project/data/fallback-rates.json",
      writeReport: true,
      jsonOutput: false,
      jsonOutputPath: undefined,
    });
  });

  it("returns help for -h and --help", () => {
    expect(parseAnalyzeArgs(["-h"], projectRoot)).toBe("help");
    expect(parseAnalyzeArgs(["--help"], projectRoot)).toBe("help");
  });

  it("parses long and short option forms", () => {
    expect(
      parseAnalyzeArgs(
        [
          "-i",
          "input.csv",
          "-o",
          "out.md",
          "-d",
          "2026-06-19",
          "--mock",
          "--json",
          "--no-write",
          "--policy",
          "policy.json",
          "--fallback-rates",
          "rates.json",
        ],
        projectRoot,
      ),
    ).toEqual({
      csvPath: "/project/input.csv",
      outputPath: "/project/out.md",
      referenceDate: "2026-06-19",
      mockRates: true,
      policyPath: "/project/policy.json",
      fallbackRatesPath: "/project/rates.json",
      writeReport: false,
      jsonOutput: true,
      jsonOutputPath: undefined,
    });
  });

  it("parses --json-output and enables json mode", () => {
    expect(
      parseAnalyzeArgs(["--json-output", "out.json"], projectRoot),
    ).toMatchObject({
      jsonOutput: true,
      jsonOutputPath: "/project/out.json",
    });
  });

  it("accepts --offline as an alias for --mock", () => {
    expect(parseAnalyzeArgs(["--offline"], projectRoot)).toMatchObject({
      mockRates: true,
    });
  });

  it("supports positional csv and output arguments", () => {
    expect(parseAnalyzeArgs(["data.csv", "report.md"], projectRoot)).toEqual({
      csvPath: "/project/data.csv",
      outputPath: "/project/report.md",
      referenceDate: undefined,
      mockRates: false,
      policyPath: "/project/policy.json",
      fallbackRatesPath: "/project/data/fallback-rates.json",
      writeReport: true,
      jsonOutput: false,
      jsonOutputPath: undefined,
    });
  });

  it("lets explicit flags override positional arguments", () => {
    expect(
      parseAnalyzeArgs(
        ["legacy.csv", "legacy.md", "-i", "flag.csv", "-o", "flag.md"],
        projectRoot,
      ),
    ).toMatchObject({
      csvPath: "/project/flag.csv",
      outputPath: "/project/flag.md",
    });
  });

  it("preserves absolute paths", () => {
    expect(parseAnalyzeArgs(["/tmp/data.csv"], projectRoot)).toMatchObject({
      csvPath: "/tmp/data.csv",
    });
  });

  it("throws for unknown options", () => {
    expect(() => parseAnalyzeArgs(["--unknown"], projectRoot)).toThrow(
      "Unknown option: --unknown",
    );
  });

  it("throws when an option value is missing", () => {
    expect(() => parseAnalyzeArgs(["-i"], projectRoot)).toThrow(
      "Missing value for -i",
    );
  });

  it("throws when too many positional arguments are provided", () => {
    expect(() =>
      parseAnalyzeArgs(["a.csv", "b.md", "extra.md"], projectRoot),
    ).toThrow("Too many positional arguments");
  });
});

describe("loadPolicyFromFile", () => {
  it("parses and freezes policy JSON", () => {
    const politica = loadPolicyFromFile("policy.json", () =>
      JSON.stringify(defaultPolitica),
    );

    expect(politica.moneda_base).toBe("USD");
    expect(Object.isFrozen(politica)).toBe(true);
  });
});

describe("createAnalyzeRateResolver", () => {
  const readFile = vi.fn(() => fallbackRatesJson);

  it("creates an offline resolver when mock mode is enabled", async () => {
    const resolver = createAnalyzeRateResolver(
      {
        mockRates: true,
        fallbackRatesPath: "/project/data/fallback-rates.json",
      },
      {
        projectRoot: "/project",
        readFile,
        loadEnv: vi.fn(),
        getAppId: vi.fn(),
      },
    );

    const resolution = await resolver.resolve(["2026-06-04", "2026-06-09"]);

    expect(resolution.apiCallCount).toBe(0);
    expect(resolution.fallbackDates).toEqual(["2026-06-04", "2026-06-09"]);
    expect(resolution.liveDates).toEqual([]);
  });

  it("attempts live rates when mock mode is disabled and app id exists", async () => {
    const loadEnv = vi.fn();
    const getAppId = vi.fn(() => "test-app-id");

    const resolver = createAnalyzeRateResolver(
      {
        mockRates: false,
        fallbackRatesPath: "/project/data/fallback-rates.json",
      },
      {
        projectRoot: "/project",
        readFile,
        loadEnv,
        getAppId,
      },
    );

    expect(loadEnv).toHaveBeenCalledOnce();
    expect(getAppId).toHaveBeenCalledOnce();
    expect(resolver).toBeDefined();
  });

  it("throws when mock mode is disabled and app id is missing", () => {
    expect(() =>
      createAnalyzeRateResolver(
        {
          mockRates: false,
          fallbackRatesPath: "/project/data/fallback-rates.json",
        },
        {
          projectRoot: "/project",
          readFile,
          loadEnv: vi.fn(),
          getAppId: vi.fn(() => undefined),
        },
      ),
    ).toThrow(MissingApiKeyError);
  });
});

describe("serializeBatchReport", () => {
  it("produces JSON-safe output without rate provider instances", async () => {
    const dir = createTempDir();
    const csvPath = join(dir, "input.csv");
    const outputPath = join(dir, "ANALISIS.md");
    const fallbackPath = join(dir, "fallback.json");
    const policyPath = join(dir, "policy.json");
    writeFileSync(csvPath, sampleCsv, "utf-8");
    writeFileSync(fallbackPath, fallbackRatesJson, "utf-8");
    writeFileSync(policyPath, committedPolicyJson, "utf-8");

    const deps = {
      projectRoot: dir,
      readFile: (path: string) => {
        if (path === csvPath) return sampleCsv;
        if (path === fallbackPath) return fallbackRatesJson;
        if (path === policyPath) return committedPolicyJson;
        throw new Error(`ENOENT: ${path}`);
      },
      writeFile: vi.fn(),
      loadEnv: vi.fn(),
      getAppId: vi.fn(() => undefined),
    };

    try {
      const result = await runAnalyze(
        {
          csvPath,
          outputPath,
          mockRates: true,
          fallbackRatesPath: fallbackPath,
          writeReport: false,
          jsonOutput: false,
        },
        deps,
      );

      const json = serializeBatchReport(result.report);
      expect(() => JSON.stringify(json)).not.toThrow();
      expect(json).toMatchObject({
        validRows: 3,
        rateResolution: {
          apiCallCount: 0,
        },
      });
      expect(json).not.toHaveProperty("providersByDate");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("runAnalyze", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function createDeps(
    overrides: {
      csvContent?: string;
      policyJson?: string;
      fallbackJson?: string;
    } = {},
  ) {
    const dir = createTempDir();
    tempDirs.push(dir);

    const csvPath = join(dir, "input.csv");
    const outputPath = join(dir, "ANALISIS.md");
    const fallbackPath = join(dir, "fallback.json");
    const policyPath = join(dir, "policy.json");
    const policyContent = overrides.policyJson ?? committedPolicyJson;

    writeFileSync(csvPath, overrides.csvContent ?? sampleCsv, "utf-8");
    writeFileSync(
      fallbackPath,
      overrides.fallbackJson ?? fallbackRatesJson,
      "utf-8",
    );
    writeFileSync(policyPath, policyContent, "utf-8");

    const files = new Map<string, string>([
      [csvPath, overrides.csvContent ?? sampleCsv],
      [fallbackPath, overrides.fallbackJson ?? fallbackRatesJson],
      [policyPath, policyContent],
    ]);

    const written = new Map<string, string>();

    return {
      dir,
      csvPath,
      outputPath,
      fallbackPath,
      policyPath,
      deps: {
        projectRoot: dir,
        readFile: (path: string) => {
          const content = files.get(path);
          if (content === undefined) {
            throw new Error(`ENOENT: ${path}`);
          }
          return content;
        },
        writeFile: (path: string, content: string) => {
          written.set(path, content);
        },
        loadEnv: vi.fn(),
        getAppId: vi.fn(() => undefined),
      },
      written,
    };
  }

  it("writes markdown output by default", async () => {
    const { csvPath, outputPath, fallbackPath, deps, written } = createDeps();

    const result = await runAnalyze(
      {
        csvPath,
        outputPath,
        mockRates: true,
        fallbackRatesPath: fallbackPath,
        writeReport: true,
        jsonOutput: false,
      },
      deps,
    );

    expect(result.outputPath).toBe(outputPath);
    expect(written.get(outputPath)).toBe(result.markdown);
    expect(result.report.validRows).toBe(3);
    expect(result.report.referenceDate).toBe("2026-06-19");
    expect(result.summary).toContain("APROBADO:");
  });

  it("uses a custom reference date", async () => {
    const { csvPath, outputPath, fallbackPath, deps } = createDeps();

    const result = await runAnalyze(
      {
        csvPath,
        outputPath,
        referenceDate: "2026-01-01",
        mockRates: true,
        fallbackRatesPath: fallbackPath,
        writeReport: false,
        jsonOutput: false,
      },
      deps,
    );

    expect(result.report.referenceDate).toBe("2026-01-01");
    expect(result.outputPath).toBeUndefined();
  });

  it("loads a custom policy file when provided", async () => {
    const strictPolicy = {
      ...defaultPolitica,
      limites_por_categoria: {
        food: { aprobado_hasta: "10", pendiente_hasta: "20" },
      },
    };

    const { csvPath, outputPath, fallbackPath, policyPath, deps } = createDeps({
      policyJson: JSON.stringify(strictPolicy),
    });

    const result = await runAnalyze(
      {
        csvPath,
        outputPath,
        policyPath,
        mockRates: true,
        fallbackRatesPath: fallbackPath,
        writeReport: false,
        jsonOutput: false,
      },
      deps,
    );

    expect(result.report.statusBreakdown.RECHAZADO).toBeGreaterThan(0);
  });

  it("detects duplicate and negative anomalies in the report", async () => {
    const csvWithAnomalies = `${sampleCsv}g_004,e_002,Bruno,Soto,sales_team,food,-10,USD,2026-06-10
`;

    const { csvPath, outputPath, fallbackPath, deps } = createDeps({
      csvContent: csvWithAnomalies,
    });

    const result = await runAnalyze(
      {
        csvPath,
        outputPath,
        mockRates: true,
        fallbackRatesPath: fallbackPath,
        writeReport: false,
        jsonOutput: false,
      },
      deps,
    );

    expect(result.report.duplicateGroups).toHaveLength(1);
    expect(result.report.negativeAmountIds).toEqual(["g_004"]);
  });
});

describe("mainAnalyze", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function createMainDeps(csvContent = sampleCsv) {
    const dir = createTempDir();
    tempDirs.push(dir);

    const csvPath = join(dir, "input.csv");
    const outputPath = join(dir, "ANALISIS.md");
    const fallbackPath = join(dir, "fallback.json");

    const policyPath = join(dir, "policy.json");

    writeFileSync(csvPath, csvContent, "utf-8");
    writeFileSync(fallbackPath, fallbackRatesJson, "utf-8");
    writeFileSync(policyPath, committedPolicyJson, "utf-8");

    const files = new Map<string, string>([
      [csvPath, csvContent],
      [fallbackPath, fallbackRatesJson],
      [policyPath, committedPolicyJson],
    ]);
    const written = new Map<string, string>();

    return {
      csvPath,
      outputPath,
      fallbackPath,
      written,
      deps: {
        projectRoot: dir,
        readFile: (path: string) => files.get(path)!,
        writeFile: (path: string, content: string) => {
          written.set(path, content);
        },
        loadEnv: vi.fn(),
        getAppId: vi.fn(() => undefined),
      },
    };
  }

  it("returns exit code 0 and prints help", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const exitCode = await mainAnalyze(["--help"], createMainDeps().deps);

    expect(exitCode).toBe(0);
    expect(logSpy.mock.calls[0]?.[0]).toContain("Uso: analyze");
  });

  it("returns exit code 2 for invalid CLI arguments", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const exitCode = await mainAnalyze(["--bad-flag"], createMainDeps().deps);

    expect(exitCode).toBe(2);
    expect(errorSpy.mock.calls[0]?.[0]).toContain("Unknown option");
  });

  it("writes JSON to a file with --json-output", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { csvPath, outputPath, fallbackPath, deps, written } =
      createMainDeps();
    const jsonPath = join(dirname(csvPath), "report.json");

    const exitCode = await mainAnalyze(
      [
        "-i",
        csvPath,
        "-o",
        outputPath,
        "--mock",
        "--fallback-rates",
        fallbackPath,
        "--json-output",
        jsonPath,
        "--no-write",
      ],
      deps,
    );

    expect(exitCode).toBe(0);
    expect(written.has(jsonPath)).toBe(true);
    const payload = JSON.parse(written.get(jsonPath)!);
    expect(payload.validRows).toBe(3);
    expect(String(logSpy.mock.calls[0]?.[0])).toContain(jsonPath);
  });

  it("returns exit code 0 and prints JSON when --json is set", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { csvPath, outputPath, fallbackPath, deps } = createMainDeps();

    const exitCode = await mainAnalyze(
      [
        "-i",
        csvPath,
        "-o",
        outputPath,
        "--mock",
        "--fallback-rates",
        fallbackPath,
        "--json",
        "--no-write",
        "-d",
        referenceDate.toISOString().slice(0, 10),
      ],
      deps,
    );

    expect(exitCode).toBe(0);
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.validRows).toBe(3);
    expect(payload.referenceDate).toBe("2026-06-19");
    expect(payload.statusBreakdown).toBeDefined();
  });

  it("returns exit code 0 and writes markdown for a standard offline run", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { csvPath, outputPath, fallbackPath, deps, written } =
      createMainDeps();

    const exitCode = await mainAnalyze(
      [
        "-i",
        csvPath,
        "-o",
        outputPath,
        "--mock",
        "--fallback-rates",
        fallbackPath,
      ],
      deps,
    );

    expect(exitCode).toBe(0);
    expect(written.has(outputPath)).toBe(true);
    expect(String(logSpy.mock.calls.at(-1)?.[0])).toContain(outputPath);
  });

  it("exits with code 1 when API key is missing without --mock", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { csvPath, outputPath, fallbackPath, deps } = createMainDeps();

    const exitCode = await mainAnalyze(
      [
        "-i",
        csvPath,
        "-o",
        outputPath,
        "--fallback-rates",
        fallbackPath,
      ],
      deps,
    );

    expect(exitCode).toBe(1);
    expect(String(errorSpy.mock.calls[0]?.[0])).toContain(
      "OPEN_EXCHANGE_RATES_APP_ID",
    );
  });

  it("returns exit code 1 for invalid reference dates", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { csvPath, outputPath, fallbackPath, deps } = createMainDeps();

    const exitCode = await mainAnalyze(
      [
        "-i",
        csvPath,
        "-o",
        outputPath,
        "--mock",
        "--fallback-rates",
        fallbackPath,
        "-d",
        "invalid-date",
      ],
      deps,
    );

    expect(exitCode).toBe(1);
    expect(String(errorSpy.mock.calls[0]?.[0])).toMatch(/Invalid date format/i);
  });
});
