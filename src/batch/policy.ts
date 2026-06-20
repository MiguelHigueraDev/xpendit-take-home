import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePolitica } from "../domain/schemas.js";
import type { Politica } from "../domain/types.js";

/** Default policy filename at the project root. */
export const DEFAULT_POLICY_FILENAME = "policy.json";

const moduleDir = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the committed default policy JSON. */
export const defaultPolicyPath = join(moduleDir, "../../policy.json");

function loadDefaultPolitica(): Politica {
  const content = readFileSync(defaultPolicyPath, "utf-8");
  return parsePolitica(JSON.parse(content));
}

/** Default expense policy loaded from {@link defaultPolicyPath} (deep-frozen). */
export const defaultPolitica: Politica = loadDefaultPolitica();

/** Reference date used for age calculations in batch analysis (reproducible). */
export const defaultReferenceDate = new Date("2026-06-19T00:00:00.000Z");
