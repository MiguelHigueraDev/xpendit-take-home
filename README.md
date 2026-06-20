# Xpendit Rules Engine

Motor de reglas de gastos para el desafío Xpendit. Valida gastos contra una política configurable y devuelve uno de tres estados: `APROBADO`, `PENDIENTE` o `RECHAZADO`.

## Requisitos

- Node.js 20+
- npm

## Instalación

```bash
npm install
```

## Configuración

Copia `.env.example` a `.env` y agrega tu API key de Open Exchange Rates:

```bash
cp .env.example .env
```

```env
OPEN_EXCHANGE_RATES_APP_ID=your_app_id_here
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

## Parte 1 — Validador con tasas mock

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

## Parte 2 — Tasas reales (Open Exchange Rates)

El cliente API obtiene tasas históricas por fecha y construye un `InMemoryRateProvider` síncrono que se inyecta en el validador. El validador de la Parte 1 no cambia.

```typescript
import {
  ExpenseValidator,
  ExchangeRateService,
  FixedClock,
  OpenExchangeRatesClient,
  getOpenExchangeRatesAppId,
  loadEnv,
} from "./dist/index.js";

loadEnv();

const client = new OpenExchangeRatesClient({
  appId: getOpenExchangeRatesAppId(),
});
const rateService = new ExchangeRateService(client);

// Una llamada API por fecha única (cache incluido)
const rateProvider = await rateService.getProviderForDate("2026-05-20");

const validator = new ExpenseValidator({
  clock: new FixedClock(new Date("2026-06-19T00:00:00.000Z")),
  rateProvider,
});

const result = validator.validate(gasto, empleado, politica);
```

### Demo con API real

Con tu `.env` configurado:

```bash
npm run demo:rates
```

Esto valida un gasto en CLP usando tasas históricas del `2026-05-20`.

## Parte 3 — Analizador de lotes

Procesa `gastos_historicos.csv`, aplica las reglas de política con tasas históricas reales (con fallback offline), detecta anomalías (duplicados exactos y montos negativos), y genera `ANALISIS.md`.

```bash
# Analizar el CSV por defecto (gastos_historicos.csv → ANALISIS.md)
npm run analyze

# Rutas personalizadas: npm run analyze -- <csv> <salida.md>
npm run analyze -- gastos_historicos.csv ANALISIS.md
```

El analizador:
- Valida cada fila del CSV con Zod (`csv-parse` + schemas de dominio).
- Obtiene tasas históricas **una vez por fecha única** (optimización N+1).
- Usa tasas live de Open Exchange Rates cuando hay API key; si falla, usa `data/fallback-rates.json`.
- Detecta duplicados exactos (mismo monto, moneda, fecha) y montos negativos como alertas de anomalía.
- Escribe el reporte en `ANALISIS.md` con desglose por estado, ejemplos y explicación de la optimización.

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

## Montos y precisión monetaria

Los montos de gastos, límites de categoría y tablas de tasas de cambio se manejan con [`decimal.js`](https://mikemcl.github.io/decimal.js/) (`Money = Decimal`) para evitar errores de punto flotante en conversiones FX y comparaciones de límites.

- Los montos pueden ingresarse como `number` o `string` en CSV, política y API; Zod los transforma a `Decimal` vía `moneySchema`.
- Las conversiones de moneda se redondean a **4 decimales** (`ROUND_HALF_UP`), alineado con Open Exchange Rates.
- Los umbrales de antigüedad (`pendiente_dias` / `rechazado_dias`) siguen siendo enteros (`number`), ya que representan días, no dinero.

Helpers exportados desde `src/domain/money.ts`: `toMoney`, `roundMoney`, `moneyKey`, `moneySchema`, `positiveRateSchema`.

## Estructura del proyecto

```
src/
  batch/           # CSV loader, anomalías, analizador, reporting, CLI
  config/          # Carga de .env (dotenv) y API key
  domain/          # Tipos, schemas Zod, money (decimal.js) y códigos de alerta
  rules/           # Reglas puras (antigüedad, categoría, centro de costo)
  services/        # Validador, cliente API, cache de tasas, reloj
data/
  fallback-rates.json   # Tasas offline para fallback
examples/
  validateWithLiveRates.ts   # Demo Parte 2
tests/
  unit/            # Pruebas exhaustivas (sin red)
ANALISIS.md        # Reporte generado por Parte 3
```
