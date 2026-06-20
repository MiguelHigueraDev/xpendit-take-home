import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExpenseController } from "./expense.controller.js";
import { EngineService } from "./engine.service.js";

describe("ExpenseController", () => {
  let controller: ExpenseController;
  let engineService: EngineService;

  beforeEach(() => {
    controller = new ExpenseController();
    engineService = (controller as unknown as { engineService: EngineService })
      .engineService;
  });

  it("delegates getPolicy to EngineService", () => {
    const policy = { moneda_base: "USD" };
    vi.spyOn(engineService, "getPolicy").mockReturnValue(policy);

    expect(controller.getPolicy()).toBe(policy);
    expect(engineService.getPolicy).toHaveBeenCalledOnce();
  });

  it("delegates validate to EngineService", () => {
    const request = {
      gasto: {
        id: "g_001",
        monto: 50,
        moneda: "USD",
        fecha: "2026-06-04",
        categoria: "food",
      },
      empleado: {
        id: "e_002",
        nombre: "Bruno",
        apellido: "Soto",
        cost_center: "sales_team",
      },
    };
    const validationResult = {
      gasto_id: "g_001",
      status: "APROBADO" as const,
      alertas: [],
    };
    vi.spyOn(engineService, "validate").mockReturnValue(validationResult);

    expect(controller.validate(request)).toBe(validationResult);
    expect(engineService.validate).toHaveBeenCalledWith(request);
  });

  it("delegates analyze to EngineService", async () => {
    const report = { totalCsvRows: 1 };
    vi.spyOn(engineService, "analyzeCsv").mockResolvedValue(report);

    await expect(controller.analyze("csv-content")).resolves.toBe(report);
    expect(engineService.analyzeCsv).toHaveBeenCalledWith("csv-content");
  });
});
