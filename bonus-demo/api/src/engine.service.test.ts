import { describe, expect, it } from "vitest";
import {
  ALERT_CODES,
  defaultPolitica,
  defaultReferenceDate,
  ValidationError,
} from "xpendit-rules-engine";
import { EngineService } from "./engine.service.js";
import type { ValidateRequestDto } from "./dto.js";

const salesEmployee = {
  id: "e_002",
  nombre: "Bruno",
  apellido: "Soto",
  cost_center: "sales_team",
} satisfies ValidateRequestDto["empleado"];

const engineeringEmployee = {
  id: "e_001",
  nombre: "Ana",
  apellido: "Reyes",
  cost_center: "core_engineering",
} satisfies ValidateRequestDto["empleado"];

describe("EngineService", () => {
  const service = new EngineService();

  describe("getPolicy", () => {
    it("returns the default policy with serialized money limits", () => {
      const policy = service.getPolicy();

      expect(policy.moneda_base).toBe(defaultPolitica.moneda_base);
      expect(policy.limite_antiguedad).toEqual(defaultPolitica.limite_antiguedad);
      expect(policy.reglas_centro_costo).toEqual(defaultPolitica.reglas_centro_costo);
      expect(policy.categoria_desconocida).toBe(defaultPolitica.categoria_desconocida);

      const foodLimits = (policy.limites_por_categoria as Record<string, unknown>)
        .food as Record<string, string>;
      expect(foodLimits.aprobado_hasta).toBe(
        defaultPolitica.limites_por_categoria.food!.aprobado_hasta.toString(),
      );
    });
  });

  describe("validate", () => {
    it("returns APROBADO for a compliant recent food expense", () => {
      const result = service.validate({
        gasto: {
          id: "g_125",
          monto: 50,
          moneda: "USD",
          fecha: "2026-06-04",
          categoria: "food",
        },
        empleado: salesEmployee,
      });

      expect(result).toEqual({
        gasto_id: "g_125",
        status: "APROBADO",
        alertas: [],
      });
    });

    it("returns RECHAZADO when the cost center forbids the category", () => {
      const result = service.validate({
        gasto: {
          id: "g_124",
          monto: 50,
          moneda: "USD",
          fecha: "2026-06-04",
          categoria: "food",
        },
        empleado: engineeringEmployee,
      });

      expect(result.status).toBe("RECHAZADO");
      expect(result.alertas).toEqual([
        expect.objectContaining({
          codigo: ALERT_CODES.POLITICA_CENTRO_COSTO,
        }),
      ]);
    });

    it("uses a custom reference date when provided", () => {
      const withDefaultDate = service.validate({
        gasto: {
          id: "g_age",
          monto: 50,
          moneda: "USD",
          fecha: "2026-05-19",
          categoria: "food",
        },
        empleado: salesEmployee,
      });

      const withEarlierReference = service.validate({
        gasto: {
          id: "g_age",
          monto: 50,
          moneda: "USD",
          fecha: "2026-05-19",
          categoria: "food",
        },
        empleado: salesEmployee,
        referenceDate: "2026-06-04",
      });

      expect(withDefaultDate.status).toBe("PENDIENTE");
      expect(withEarlierReference.status).toBe("APROBADO");
    });

    it("throws ValidationError for invalid request data", () => {
      expect(() =>
        service.validate({
          gasto: {
            id: "g_bad",
            monto: 50,
            moneda: "USD",
            fecha: "not-a-date",
            categoria: "food",
          },
          empleado: salesEmployee,
        }),
      ).toThrow(ValidationError);
    });
  });

  describe("analyzeCsv", () => {
    it("returns a serialized batch report for valid CSV content", async () => {
      const csv = [
        "gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha",
        "g_001,e_002,Bruno,Soto,sales_team,food,50,USD,2026-06-04",
        "g_011,e_001,Ana,Reyes,core_engineering,food,50,USD,2026-06-04",
      ].join("\n");

      const report = await service.analyzeCsv(csv);

      expect(report.referenceDate).toBe(defaultReferenceDate.toISOString().slice(0, 10));
      expect(report.totalCsvRows).toBe(2);
      expect(report.validRows).toBe(2);
      expect(report.statusBreakdown).toEqual({
        APROBADO: 1,
        PENDIENTE: 0,
        RECHAZADO: 1,
      });
    });
  });
});
