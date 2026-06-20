import { readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { loadEnv, MissingApiKeyError } from "../config/env.js";
import { parsePolitica } from "../domain/schemas.js";
import type { Politica } from "../domain/types.js";
import { FixedClock, parseIsoDate } from "../services/clock.js";
import { ExchangeRateService } from "../services/exchange-rate-service.js";
import { OpenExchangeRatesClient } from "../services/open-exchange-rates-client.js";
import { ValidationError } from "../validation/errors.js";
import { BatchAnalyzer } from "./batch-analyzer.js";
import {
  BatchRateResolver,
  parseFallbackRatesFile,
  type RateResolver,
} from "./batch-rate-resolver.js";
import {
  DEFAULT_POLICY_FILENAME,
  defaultReferenceDate,
} from "./policy.js";
import { renderAnalysisMarkdown, renderConsoleSummary } from "./reporting.js";
import type { BatchAnalysisReport } from "./types.js";

/** Default CSV filename relative to the project root. */
export const DEFAULT_CSV_FILENAME = "gastos-historicos.csv";

/** Default markdown output filename relative to the project root. */
export const DEFAULT_OUTPUT_FILENAME = "ANALISIS.md";

/** Default fallback rates path relative to the project root. */
export const DEFAULT_FALLBACK_RATES_PATH = "data/fallback-rates.json";

/** Parsed CLI options for the batch analyzer. */
export interface AnalyzeCliOptions {
  csvPath: string;
  outputPath: string;
  referenceDate?: string;
  mockRates: boolean;
  policyPath?: string;
  fallbackRatesPath: string;
  writeReport: boolean;
  jsonOutput: boolean;
  jsonOutputPath?: string;
}

/** Result of a successful CLI analysis run. */
export interface AnalyzeCliResult {
  report: BatchAnalysisReport;
  summary: string;
  markdown: string;
  outputPath?: string;
}

/** File-system and environment dependencies injectable for testing. */
export interface AnalyzeCliDependencies {
  projectRoot: string;
  readFile: (path: string, encoding: BufferEncoding) => string;
  writeFile: (path: string, content: string) => void;
  loadEnv: () => void;
  getAppId: () => string | undefined;
}

const DEFAULT_DEPENDENCIES: AnalyzeCliDependencies = {
  projectRoot: resolve(import.meta.dirname, "../.."),
  readFile: readFileSync,
  writeFile: writeFileSync,
  loadEnv,
  getAppId: () => process.env.OPEN_EXCHANGE_RATES_APP_ID,
};

/**
 * Returns the CLI help text.
 */
export function renderAnalyzeHelp(): string {
  return `Uso: analyze [opciones] [csv] [salida.md]

Analiza un CSV de gastos históricos y genera un reporte ANALISIS.md.

Argumentos posicionales:
  csv                 Ruta al archivo CSV (default: gastos-historicos.csv)
  salida.md           Ruta del reporte markdown (default: ANALISIS.md)

Opciones:
  -h, --help                  Muestra esta ayuda
  -i, --input <path>          Ruta al archivo CSV
  -o, --output <path>         Ruta del reporte markdown
  -d, --reference-date <date> Fecha de referencia ISO (YYYY-MM-DD)
  --mock, --offline            Usa tasas de respaldo locales (sin API)
  --policy <path>             Archivo JSON con la política (default: policy.json)
  --fallback-rates <path>     Archivo JSON de tasas de respaldo
  --no-write                  No escribe el archivo de salida
  --json                      Imprime el reporte completo como JSON en stdout
  --json-output <path>        Escribe el reporte JSON en un archivo

Ejemplos:
  npm run analyze
  npm run analyze -- --mock -d 2026-06-19
  npm run analyze -- -i gastos-historicos.csv -o ANALISIS.md --offline
  npm run analyze -- --json --no-write --mock
`;
}

class AnalyzeCliParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalyzeCliParseError";
  }
}

function resolveProjectPath(projectRoot: string, path: string): string {
  return isAbsolute(path) ? path : resolve(projectRoot, path);
}

function readOptionValue(
  args: string[],
  index: number,
  flag: string,
): { value: string; nextIndex: number } {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) {
    throw new AnalyzeCliParseError(`Missing value for ${flag}`);
  }

  return { value, nextIndex: index + 1 };
}

/**
 * Parses CLI arguments into {@link AnalyzeCliOptions}.
 * @param argv - Raw process arguments (without node executable paths).
 * @param projectRoot - Project root used to resolve relative paths.
 */
export function parseAnalyzeArgs(
  argv: string[],
  projectRoot: string,
): AnalyzeCliOptions | "help" {
  let csvPath = resolveProjectPath(projectRoot, DEFAULT_CSV_FILENAME);
  let outputPath = resolveProjectPath(projectRoot, DEFAULT_OUTPUT_FILENAME);
  let csvFromFlag = false;
  let outputFromFlag = false;
  let referenceDate: string | undefined;
  let mockRates = false;
  let policyPath = resolveProjectPath(projectRoot, DEFAULT_POLICY_FILENAME);
  let fallbackRatesPath = resolveProjectPath(
    projectRoot,
    DEFAULT_FALLBACK_RATES_PATH,
  );
  let writeReport = true;
  let jsonOutput = false;
  let jsonOutputPath: string | undefined;

  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;

    switch (arg) {
      case "-h":
      case "--help":
        return "help";
      case "-i":
      case "--input": {
        const { value, nextIndex } = readOptionValue(argv, index, arg);
        csvPath = resolveProjectPath(projectRoot, value);
        csvFromFlag = true;
        index = nextIndex;
        break;
      }
      case "-o":
      case "--output": {
        const { value, nextIndex } = readOptionValue(argv, index, arg);
        outputPath = resolveProjectPath(projectRoot, value);
        outputFromFlag = true;
        index = nextIndex;
        break;
      }
      case "-d":
      case "--reference-date": {
        const { value, nextIndex } = readOptionValue(argv, index, arg);
        referenceDate = value;
        index = nextIndex;
        break;
      }
      case "--policy": {
        const { value, nextIndex } = readOptionValue(argv, index, arg);
        policyPath = resolveProjectPath(projectRoot, value);
        index = nextIndex;
        break;
      }
      case "--fallback-rates": {
        const { value, nextIndex } = readOptionValue(argv, index, arg);
        fallbackRatesPath = resolveProjectPath(projectRoot, value);
        index = nextIndex;
        break;
      }
      case "--mock":
      case "--offline":
        mockRates = true;
        break;
      case "--no-write":
        writeReport = false;
        break;
      case "--json":
        jsonOutput = true;
        break;
      case "--json-output": {
        const { value, nextIndex } = readOptionValue(argv, index, arg);
        jsonOutputPath = resolveProjectPath(projectRoot, value);
        jsonOutput = true;
        index = nextIndex;
        break;
      }
      default:
        if (arg.startsWith("-")) {
          throw new AnalyzeCliParseError(`Unknown option: ${arg}`);
        }
        positional.push(arg);
        break;
    }
  }

  if (!csvFromFlag && positional[0]) {
    csvPath = resolveProjectPath(projectRoot, positional[0]);
  }
  if (!outputFromFlag && positional[1]) {
    outputPath = resolveProjectPath(projectRoot, positional[1]);
  }
  if (positional.length > 2) {
    throw new AnalyzeCliParseError("Too many positional arguments");
  }

  return {
    csvPath,
    outputPath,
    referenceDate,
    mockRates,
    policyPath,
    fallbackRatesPath,
    writeReport,
    jsonOutput,
    jsonOutputPath,
  };
}

/**
 * Loads a policy from a JSON file.
 * @param policyPath - Path to the policy JSON file.
 * @param readFile - File reader dependency.
 */
export function loadPolicyFromFile(
  policyPath: string,
  readFile: AnalyzeCliDependencies["readFile"],
): Politica {
  const content = readFile(policyPath, "utf-8");
  return parsePolitica(JSON.parse(content));
}

/**
 * Creates a rate resolver for the batch analyzer CLI.
 */
export function createAnalyzeRateResolver(
  options: Pick<AnalyzeCliOptions, "mockRates" | "fallbackRatesPath">,
  deps: Pick<
    AnalyzeCliDependencies,
    "readFile" | "loadEnv" | "getAppId" | "projectRoot"
  >,
): RateResolver {
  if (options.mockRates) {
    const fallback = parseFallbackRatesFile(
      deps.readFile(options.fallbackRatesPath, "utf-8"),
    );

    return new BatchRateResolver({
      rateService: null,
      fallbackRates: fallback.rates,
      baseCurrency: fallback.base,
    });
  }

  deps.loadEnv();
  const appId = deps.getAppId();
  if (!appId) {
    throw new MissingApiKeyError();
  }

  const client = new OpenExchangeRatesClient({ appId });
  const rateService = new ExchangeRateService(client);

  return new BatchRateResolver({
    rateService,
  });
}

/**
 * Runs the batch analysis pipeline with the given CLI options.
 */
export async function runAnalyze(
  options: AnalyzeCliOptions,
  deps: AnalyzeCliDependencies = DEFAULT_DEPENDENCIES,
): Promise<AnalyzeCliResult> {
  const csvContent = deps.readFile(options.csvPath, "utf-8");
  const policyPath =
    options.policyPath ??
    resolveProjectPath(deps.projectRoot, DEFAULT_POLICY_FILENAME);
  const politica = loadPolicyFromFile(policyPath, deps.readFile);

  const referenceDate = options.referenceDate
    ? parseIsoDate(options.referenceDate)
    : defaultReferenceDate;

  const analyzer = new BatchAnalyzer({
    politica,
    clock: new FixedClock(referenceDate),
    rateResolver: createAnalyzeRateResolver(options, deps),
  });

  const report = await analyzer.analyze(csvContent);
  const markdown = renderAnalysisMarkdown(report);
  const summary = renderConsoleSummary(report);

  let outputPath: string | undefined;
  if (options.writeReport) {
    deps.writeFile(options.outputPath, markdown);
    outputPath = options.outputPath;
  }

  return {
    report,
    summary,
    markdown,
    outputPath,
  };
}

/**
 * CLI entrypoint used by analyze.ts.
 * @returns Process exit code.
 */
export async function mainAnalyze(
  argv: string[],
  deps: AnalyzeCliDependencies = DEFAULT_DEPENDENCIES,
): Promise<number> {
  try {
    const parsed = parseAnalyzeArgs(argv, deps.projectRoot);

    if (parsed === "help") {
      console.log(renderAnalyzeHelp());
      return 0;
    }

    const result = await runAnalyze(parsed, deps);

    if (parsed.jsonOutput) {
      const json = JSON.stringify(serializeBatchReport(result.report), null, 2);

      if (parsed.jsonOutputPath) {
        deps.writeFile(parsed.jsonOutputPath, json);
        console.log(`JSON escrito en: ${parsed.jsonOutputPath}`);
      } else {
        console.log(json);
      }
    } else {
      console.log(result.summary);
      if (result.outputPath) {
        console.log(`\nReporte escrito en: ${result.outputPath}`);
      }
    }

    return 0;
  } catch (error) {
    if (error instanceof AnalyzeCliParseError) {
      console.error(error.message);
      console.error(`\n${renderAnalyzeHelp()}`);
      return 2;
    }

    if (error instanceof ValidationError || error instanceof MissingApiKeyError) {
      console.error(error.message);
      return 1;
    }

    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
}

/**
 * Converts a batch report into a JSON-serializable plain object.
 */
export function serializeBatchReport(
  report: BatchAnalysisReport,
): Record<string, unknown> {
  return {
    referenceDate: report.referenceDate,
    totalCsvRows: report.totalCsvRows,
    validRows: report.validRows,
    malformedRows: report.malformedRows,
    statusBreakdown: report.statusBreakdown,
    duplicateGroups: report.duplicateGroups.map((group) => ({
      monto: group.monto.toString(),
      moneda: group.moneda,
      fecha: group.fecha,
      gasto_ids: group.gasto_ids,
    })),
    negativeAmountIds: report.negativeAmountIds,
    rateResolution: {
      uniqueDates: report.rateResolution.uniqueDates,
      liveDates: report.rateResolution.liveDates,
      fallbackDates: report.rateResolution.fallbackDates,
      apiCallCount: report.rateResolution.apiCallCount,
    },
    results: report.results.map((result) => ({
      gasto_id: result.gasto_id,
      validation: result.validation,
      anomalies: result.anomalies,
    })),
  };
}
