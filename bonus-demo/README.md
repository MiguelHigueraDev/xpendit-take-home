# Demo Bonus (Opcional)

Este directorio **no forma parte de los requisitos principales del ejercicio**. Es un wrapper full-stack ligero que demuestra el motor de reglas en acción sobre HTTP.

## Stack

- **API:** NestJS + Fastify (`bonus-demo/api`)
- **Web:** React + TypeScript + Vite (`bonus-demo/web`)

Sin autenticación, logging, base de datos ni load testing — quedan intencionalmente fuera del alcance.

## Requisitos previos

- Node.js 20+
- Motor raíz compilado una vez: `npm run build` desde la raíz del repositorio

## Ejecución

```bash
# Desde la raíz del repositorio
npm run build

# Desde bonus-demo/
npm install
npm run dev
```

- API: http://localhost:3001
- Web: http://localhost:5173 (proxifica `/api` hacia la API)

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/policy` | Política de gastos por defecto |
| POST | `/api/validate` | Valida un gasto individual + empleado |
| POST | `/api/analyze` | Analiza un lote CSV (tasas mock offline) |

La demo usa tasas de respaldo de `data/fallback-rates.json` — no se requiere clave de API de Open Exchange Rates.

## Verificación

1. **Validar:** envía un gasto de comida reciente por debajo de $100 USD → `APROBADO`
2. **Analizar:** sube `gastos-historicos.csv` desde la raíz del repositorio → el desglose debe coincidir con `ANALISIS.md` (13 / 13 / 24)
