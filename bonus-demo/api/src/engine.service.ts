import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Injectable } from "@nestjs/common";
import {
  BatchAnalyzer,
  BatchRateResolver,
  defaultPolitica,
  defaultReferenceDate,
  ExpenseValidator,
  FixedClock,
  InMemoryRateProvider,
  parseFallbackRatesFile,
  parseIsoDate,
  serializeBatchReport,
  toMoney,
  type Politica,
  type ValidationResult,
} from "xpendit-rules-engine";
import type { ValidateRequestDto } from "./dto.js";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(moduleDir, "../../..");
const fallbackRatesPath = join(repoRoot, "data/fallback-rates.json");

function loadFallbackRates() {
  const content = readFileSync(fallbackRatesPath, "utf-8");
  return parseFallbackRatesFile(content);
}

function serializePolitica(politica: Politica): Record<string, unknown> {
  return {
    moneda_base: politica.moneda_base,
    limite_antiguedad: politica.limite_antiguedad,
    limites_por_categoria: Object.fromEntries(
      Object.entries(politica.limites_por_categoria).map(([category, limits]) => [
        category,
        {
          aprobado_hasta: limits.aprobado_hasta.toString(),
          pendiente_hasta: limits.pendiente_hasta.toString(),
        },
      ]),
    ),
    reglas_centro_costo: politica.reglas_centro_costo,
    categoria_desconocida: politica.categoria_desconocida,
  };
}

@Injectable()
export class EngineService {
  private readonly fallbackRates = loadFallbackRates();

  getPolicy(): Record<string, unknown> {
    const monedasDisponibles = [
      this.fallbackRates.base,
      ...Object.keys(this.fallbackRates.rates),
    ].sort();

    return {
      ...serializePolitica(defaultPolitica),
      monedas_disponibles: monedasDisponibles,
    };
  }

  validate(request: ValidateRequestDto): ValidationResult {
    const referenceDate = request.referenceDate
      ? parseIsoDate(request.referenceDate)
      : defaultReferenceDate;

    const rateProvider = new InMemoryRateProvider(
      this.fallbackRates.rates,
      this.fallbackRates.base,
    );

    const validator = new ExpenseValidator({
      clock: new FixedClock(referenceDate),
      rateProvider,
    });

    return validator.validate(
      {
        ...request.gasto,
        monto: toMoney(request.gasto.monto),
      },
      request.empleado,
      defaultPolitica,
    );
  }

  async analyzeCsv(csvContent: string): Promise<Record<string, unknown>> {
    const rateResolver = new BatchRateResolver({
      rateService: null,
      fallbackRates: this.fallbackRates.rates,
      baseCurrency: this.fallbackRates.base,
    });

    const analyzer = new BatchAnalyzer({
      politica: defaultPolitica,
      clock: new FixedClock(defaultReferenceDate),
      rateResolver,
    });

    const report = await analyzer.analyze(csvContent);
    return serializeBatchReport(report);
  }
}
