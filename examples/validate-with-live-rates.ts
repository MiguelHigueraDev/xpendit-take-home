/**
 * Demo script (Part 2): validates an expense using live historical exchange rates.
 *
 * Requires `OPEN_EXCHANGE_RATES_APP_ID` in `.env`.
 *
 * Run with: `npm run demo:rates`
 */
import {
  defaultPolitica,
  ExpenseValidator,
  ExchangeRateService,
  FixedClock,
  OpenExchangeRatesClient,
  getOpenExchangeRatesAppId,
  loadEnv,
  toMoney,
} from "../src/index.js";

loadEnv();

const gasto = {
  id: "g_004",
  monto: toMoney(81000),
  moneda: "CLP",
  fecha: "2026-05-20",
  categoria: "food",
};

const empleado = {
  id: "e_005",
  nombre: "Eva",
  apellido: "Luna",
  cost_center: "sales_team",
};

const client = new OpenExchangeRatesClient({
  appId: getOpenExchangeRatesAppId(),
});
const rateService = new ExchangeRateService(client);

const rateProvider = await rateService.getProviderForDate(gasto.fecha);
const validator = new ExpenseValidator({
  clock: new FixedClock(new Date("2026-06-19T00:00:00.000Z")),
  rateProvider,
});

const result = validator.validate(gasto, empleado, defaultPolitica);
console.log(JSON.stringify(result, null, 2));
