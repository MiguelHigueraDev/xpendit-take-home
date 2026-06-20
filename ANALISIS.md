# Análisis de Gastos Históricos

## Resumen

- **Fecha de referencia:** 2026-06-19
- **Filas procesadas:** 50 válidas de 50 totales
- **Filas malformadas:** 0

## Desglose por estado

| Estado | Cantidad |
|--------|----------|
| APROBADO | 13 |
| PENDIENTE | 13 |
| RECHAZADO | 24 |

## Anomalías detectadas

### Duplicados exactos (7 grupos)

Gastos con mismo monto, moneda y fecha:

- **50 USD** el 2026-06-04: g_001, g_011
- **120 USD** el 2026-05-30: g_002, g_012
- **120 USD** el 2026-03-16: g_025, g_029
- **70 USD** el 2026-06-04: g_036, g_041
- **150 USD** el 2026-03-16: g_037, g_039, g_047
- **130 EUR** el 2026-04-25: g_038, g_050
- **90 USD** el 2026-06-09: g_042, g_043, g_044

### Montos negativos (0)

_No se encontraron montos negativos en este lote._

## Ejemplos por estado

### RECHAZADOS (muestra)

- `g_003`: LIMITE_CATEGORIA
- `g_006`: LIMITE_ANTIGUEDAD, LIMITE_CATEGORIA
- `g_009`: LIMITE_ANTIGUEDAD, LIMITE_CATEGORIA
- `g_011`: POLITICA_CENTRO_COSTO; ANOMALIA_DUPLICADO
- `g_012`: LIMITE_CATEGORIA, POLITICA_CENTRO_COSTO; ANOMALIA_DUPLICADO

### PENDIENTES (muestra)

- `g_002`: LIMITE_CATEGORIA
- `g_005`: LIMITE_ANTIGUEDAD, LIMITE_CATEGORIA
- `g_007`: LIMITE_ANTIGUEDAD
- `g_008`: LIMITE_ANTIGUEDAD, LIMITE_CATEGORIA
- `g_010`: LIMITE_ANTIGUEDAD

## Filas malformadas

_No se encontraron filas malformadas._

## Optimización de llamadas a Open Exchange Rates (Bonus)

En lugar de hacer una llamada a la API por cada fila del CSV (problema N+1), el analizador:

1. Agrupa los gastos por `fecha` única (25 fechas distintas).
2. Llama a `ExchangeRateService.getProviderForDate()` **una vez por fecha** (0 llamadas live).
3. Reutiliza el `RateProvider` cacheado para todas las filas de esa fecha.

| Métrica | Valor |
|---------|-------|
| Filas válidas | 50 |
| Fechas únicas | 25 |
| Llamadas API (live) | 0 |
| Fechas con fallback | 25 |
| Ahorro vs N+1 | 50 llamadas evitadas |

En modo `--mock`, se usan tasas locales desde `data/fallback-rates.json` en lugar de la API.
