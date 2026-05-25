import { generateJSON } from "@/lib/utils/gemini";
import type { Issue, Stage3Output } from "@/lib/pipeline/schemas";

const REPAIR_SYSTEM_PROMPT = `You are a surgical schema repair engine. You receive a broken schema layer and a specific issue, and you return ONLY the fixed version of that layer. Do not change anything that isn't broken. Return valid JSON only.`;

export interface RepairResult {
  issue: string;
  layer: string;
  attempts: number;
  success: boolean;
}

export async function repairLayer(
  issue: Issue,
  schemas: Stage3Output,
  maxAttempts = 3
): Promise<{ schemas: Stage3Output; result: RepairResult }> {
  let currentSchemas = { ...schemas };
  let attempts = 0;
  let success = false;

  while (attempts < maxAttempts && !success) {
    attempts++;
    
    try {
      const layerData = getLayer(currentSchemas, issue.layer);
      
      const prompt = `Fix this specific issue in the ${issue.layer} schema:

ISSUE: ${issue.description}
AFFECTED ITEMS: ${issue.affectedItems.join(", ")}
SUGGESTED FIX: ${issue.suggestedFix || "Use your best judgment"}

CURRENT ${issue.layer.toUpperCase()} SCHEMA:
${JSON.stringify(layerData, null, 2)}

Return ONLY the fixed ${issue.layer} schema JSON. Do not include any other layers. Fix ONLY the described issue.`;

      const fixed = await generateJSON<unknown>(prompt, REPAIR_SYSTEM_PROMPT);
      currentSchemas = applyRepair(currentSchemas, issue.layer, fixed);
      success = true;
    } catch {
      if (attempts === maxAttempts) break;
      await new Promise(r => setTimeout(r, 500 * attempts));
    }
  }

  return {
    schemas: currentSchemas,
    result: {
      issue: issue.description,
      layer: issue.layer,
      attempts,
      success,
    },
  };
}

function getLayer(schemas: Stage3Output, layer: string): unknown {
  switch (layer) {
    case "ui": return schemas.uiSchema;
    case "api": return schemas.apiSchema;
    case "db": return schemas.dbSchema;
    case "auth": return schemas.authSchema;
    default: return schemas;
  }
}

function applyRepair(schemas: Stage3Output, layer: string, fixed: unknown): Stage3Output {
  switch (layer) {
    case "ui": return { ...schemas, uiSchema: fixed as Stage3Output["uiSchema"] };
    case "api": return { ...schemas, apiSchema: fixed as Stage3Output["apiSchema"] };
    case "db": return { ...schemas, dbSchema: fixed as Stage3Output["dbSchema"] };
    case "auth": return { ...schemas, authSchema: fixed as Stage3Output["authSchema"] };
    default: return schemas;
  }
}

export function autoFixWarnings(schemas: Stage3Output, warnings: Issue[]): {
  schemas: Stage3Output;
  autoFixed: { description: string; layer: string }[];
} {
  let currentSchemas = { ...schemas };
  const autoFixed: { description: string; layer: string }[] = [];

  for (const warning of warnings) {
    // Auto-fix: add missing mandatory columns
    if (warning.description.includes("missing") && warning.description.includes("column") && warning.layer === "db") {
      const tableName = warning.affectedItems[0];
      const tableIndex = currentSchemas.dbSchema.tables.findIndex(t => t.name === tableName);
      
      if (tableIndex !== -1) {
        const table = currentSchemas.dbSchema.tables[tableIndex];
        const cols = [...table.columns];
        
        if (warning.description.includes("created_at") && !cols.some(c => c.name === "created_at")) {
          cols.unshift({ name: "created_at", type: "timestamptz", nullable: false, unique: false, primaryKey: false, default: "now()" });
          autoFixed.push({ description: `Added created_at to ${tableName}`, layer: "db" });
        }
        if (warning.description.includes("updated_at") && !cols.some(c => c.name === "updated_at")) {
          cols.push({ name: "updated_at", type: "timestamptz", nullable: false, unique: false, primaryKey: false, default: "now()" });
          autoFixed.push({ description: `Added updated_at to ${tableName}`, layer: "db" });
        }
        if (warning.description.includes('"id"') && !cols.some(c => c.name === "id")) {
          cols.unshift({ name: "id", type: "uuid", nullable: false, unique: true, primaryKey: true, default: "gen_random_uuid()" });
          autoFixed.push({ description: `Added id to ${tableName}`, layer: "db" });
        }
        
        const updatedTables = [...currentSchemas.dbSchema.tables];
        updatedTables[tableIndex] = { ...table, columns: cols };
        currentSchemas = {
          ...currentSchemas,
          dbSchema: { ...currentSchemas.dbSchema, tables: updatedTables },
        };
      }
    }
  }

  return { schemas: currentSchemas, autoFixed };
}
