# Xpendit Rules Engine — Parte 1

Motor de reglas de gastos (lógica pura) para el desafío Xpendit. Valida gastos contra una política configurable y devuelve uno de tres estados: `APROBADO`, `PENDIENTE` o `RECHAZADO`.

## Requisitos

- Node.js 20+
- npm

## Instalación

```bash
npm install
```

## Configuración

La Parte 1 **no realiza llamadas de red**. Las tasas de cambio y la fecha de referencia se inyectan en el validador.

El archivo `.env.example` incluye `OPEN_EXCHANGE_RATES_APP_ID` para las Partes 2 y 3. Copia `.env.example` a `.env` cuando implementes la integración con Open Exchange Rates:

```bash
cp .env.example .env
```

## Ejecutar pruebas

```bash
# Ejecutar todas las pruebas unitarias
npm test

# Modo watch
npm run test:watch

# Con cobertura
npm run test:coverage
```

## Typecheck y build

```bash
npm run typecheck
npm run build
```

## Uso

```typescript
import {
  ExpenseValidator,
  FixedClock,
  InMemoryRateProvider,
} from "./dist/index.js";

const politica = {
  moneda_base: "USD",
  limite_antiguedad: { pendiente_dias: 30, rechazado_dias: 60 },
  limites_por_categoria: {
    food: { aprobado_hasta: 100, pendiente_hasta: 150 },
    transport: { aprobado_hasta: 200, pendiente_hasta: 200 },
  },
  reglas_centro_costo: [
    { cost_center: "core_engineering", categoria_prohibida: "food" },
  ],
};

const validator = new ExpenseValidator({
  clock: new FixedClock(new Date("2026-06-19T00:00:00.000Z")),
  rateProvider: new InMemoryRateProvider({ CLP: 900, MXN: 20, EUR: 0.92 }),
});

const result = validator.validate(
  {
    id: "g_125",
    monto: 50,
    moneda: "USD",
    fecha: "2026-06-04",
    categoria: "food",
  },
  {
    id: "e_002",
    nombre: "Bruno",
    apellido: "Soto",
    cost_center: "sales_team",
  },
  politica,
);

// { gasto_id: "g_125", status: "APROBADO", alertas: [] }
console.log(result);
```

## Reglas implementadas

| Regla | Condición | Resultado |
|-------|-----------|-----------|
| Antigüedad | 0–30 días | APROBADO |
| Antigüedad | 31–60 días | PENDIENTE |
| Antigüedad | > 60 días | RECHAZADO |
| Límite por categoría | monto ≤ aprobado_hasta (USD) | APROBADO |
| Límite por categoría | aprobado_hasta < monto ≤ pendiente_hasta | PENDIENTE |
| Límite por categoría | monto > pendiente_hasta | RECHAZADO |
| Centro de costo | categoría prohibida para el C.C. | RECHAZADO |

**Resolución de estado final:** RECHAZADO > PENDIENTE > APROBADO. Si ninguna regla aplica, el estado por defecto es `PENDIENTE`.

## Estructura del proyecto

```
src/
  domain/          # Tipos y códigos de alerta
  rules/           # Reglas puras (antigüedad, categoría, centro de costo)
  services/        # Validador, reloj, proveedor de tasas, resolver
tests/
  unit/            # Pruebas exhaustivas por regla e integración
```

## Próximos pasos (Partes 2 y 3)

- **Parte 2:** Reemplazar `InMemoryRateProvider` con cliente real de Open Exchange Rates.
- **Parte 3:** Script de análisis por lotes sobre `gastos_historicos.csv`.
