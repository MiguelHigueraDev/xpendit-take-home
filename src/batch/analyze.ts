import { mainAnalyze } from "./analyze-cli.js";

const exitCode = await mainAnalyze(process.argv.slice(2));
process.exit(exitCode);
