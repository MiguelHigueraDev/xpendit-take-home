import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "../config/env.js";
import { ExchangeRateService } from "../services/exchangeRateService.js";
import { OpenExchangeRatesClient } from "../services/openExchangeRatesClient.js";
import { BatchAnalyzer } from "./batchAnalyzer.js";
import {
  BatchRateResolver,
  parseFallbackRatesFile,
} from "./batchRateResolver.js";
import {
  renderAnalysisMarkdown,
  renderConsoleSummary,
} from "./reporting.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../..");

function createLiveRateResolver(): BatchRateResolver {
  const fallbackPath = join(projectRoot, "data/fallback-rates.json");
  const fallback = parseFallbackRatesFile(readFileSync(fallbackPath, "utf-8"));

  loadEnv();
  const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;

  let rateService: ExchangeRateService | null = null;
  if (appId) {
    const client = new OpenExchangeRatesClient({ appId });
    rateService = new ExchangeRateService(client);
  }

  return new BatchRateResolver({
    rateService,
    fallbackRates: fallback.rates,
    baseCurrency: fallback.base,
  });
}

async function main(): Promise<void> {
  const csvPath = process.argv[2] ?? join(projectRoot, "gastos_historicos.csv");
  const outputPath = process.argv[3] ?? join(projectRoot, "ANALISIS.md");

  const csvContent = readFileSync(csvPath, "utf-8");
  const analyzer = new BatchAnalyzer({
    rateResolver: createLiveRateResolver(),
  });

  const report = await analyzer.analyze(csvContent);
  const markdown = renderAnalysisMarkdown(report);
  const summary = renderConsoleSummary(report);

  writeFileSync(outputPath, markdown, "utf-8");
  console.log(summary);
  console.log(`\nReporte escrito en: ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
