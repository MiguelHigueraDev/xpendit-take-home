import { mainAnalyze } from "./analyzeCli.js";

const exitCode = await mainAnalyze(process.argv.slice(2));
process.exit(exitCode);
