import type { Stage2Output, Stage3Output, SimResultSchema } from "@/lib/pipeline/schemas";
import { z } from "zod";

type SimResult = z.infer<typeof SimResultSchema>;

export function simulateFlows(
  architecture: Stage2Output,
  schemas: Stage3Output
): { results: SimResult[]; executabilityScore: number } {
  const results: SimResult[] = [];
  
  const apiPaths = new Set(schemas.apiSchema.endpoints.map(e => e.path));
  const apiById = new Map(schemas.apiSchema.endpoints.map(e => [e.id, e]));
  const dbTables = new Set(schemas.dbSchema.tables.map(t => t.name));
  const authRoles = new Set(schemas.authSchema.roles.map(r => r.name));
  
  for (const flow of architecture.flows) {
    const steps = flow.steps.map(step => {
      // Find matching API endpoint
      const matchingEndpoint = schemas.apiSchema.endpoints.find(e => {
        const actionLower = step.action.toLowerCase();
        const pathLower = e.path.toLowerCase();
        const summaryLower = e.summary.toLowerCase();
        return summaryLower.includes(actionLower.split(" ")[0]) ||
          actionLower.includes(summaryLower.split(" ")[0]) ||
          pathLower.includes(actionLower.replace(/\s+/g, "-").substring(0, 10));
      });
      
      const apiEndpoint = matchingEndpoint 
        ? `${matchingEndpoint.method} ${matchingEndpoint.path}`
        : inferApiEndpoint(step.action, apiPaths);
      
      // Determine DB operation
      const dbOperation = inferDbOperation(step.action, dbTables);
      
      // Check role
      const actorRole = step.actor;
      const roleCheck = authRoles.has(actorRole) || actorRole === "system"
        ? `✓ Role "${actorRole}" is defined`
        : `✗ Role "${actorRole}" not found in auth schema`;
      
      // Determine status
      const apiExists = matchingEndpoint !== undefined || apiEndpoint !== "NO_ENDPOINT";
      const roleValid = authRoles.has(actorRole) || actorRole === "system";
      const dbValid = dbOperation !== "NO_TABLE";
      
      const status: "pass" | "fail" = apiExists && roleValid ? "pass" : "fail";
      const reason = !apiExists 
        ? `No API endpoint found for action: ${step.action}`
        : !roleValid 
        ? `Role "${actorRole}" not defined`
        : !dbValid
        ? `No DB table found for operation`
        : undefined;
      
      return {
        action: step.action,
        apiEndpoint,
        dbOperation,
        roleCheck,
        status,
        reason,
      };
    });
    
    const passCount = steps.filter(s => s.status === "pass").length;
    const overallStatus: "pass" | "fail" | "partial" = 
      passCount === steps.length ? "pass" :
      passCount === 0 ? "fail" : "partial";
    
    results.push({ flow: flow.name, steps, overallStatus });
  }
  
  // Calculate executability score
  const totalSteps = results.reduce((sum, r) => sum + r.steps.length, 0);
  const passedSteps = results.reduce((sum, r) => sum + r.steps.filter(s => s.status === "pass").length, 0);
  const executabilityScore = totalSteps > 0 ? Math.round((passedSteps / totalSteps) * 100) : 100;
  
  return { results, executabilityScore };
}

function inferApiEndpoint(action: string, apiPaths: Set<string>): string {
  const actionLower = action.toLowerCase();
  
  // Try to find a matching path
  for (const path of apiPaths) {
    const pathLower = path.toLowerCase();
    const words = actionLower.split(" ");
    if (words.some(w => w.length > 3 && pathLower.includes(w))) {
      return path;
    }
  }
  
  // Infer from action verb
  if (actionLower.includes("create") || actionLower.includes("add") || actionLower.includes("register")) {
    return "POST /api/v1/[resource]";
  }
  if (actionLower.includes("get") || actionLower.includes("fetch") || actionLower.includes("list") || actionLower.includes("view")) {
    return "GET /api/v1/[resource]";
  }
  if (actionLower.includes("update") || actionLower.includes("edit") || actionLower.includes("modify")) {
    return "PUT /api/v1/[resource]/:id";
  }
  if (actionLower.includes("delete") || actionLower.includes("remove")) {
    return "DELETE /api/v1/[resource]/:id";
  }
  
  return "NO_ENDPOINT";
}

function inferDbOperation(action: string, dbTables: Set<string>): string {
  const actionLower = action.toLowerCase();
  
  // Find matching table
  let matchedTable = "";
  for (const table of dbTables) {
    if (actionLower.includes(table.toLowerCase()) || 
        actionLower.includes(table.toLowerCase().replace(/_/g, " "))) {
      matchedTable = table;
      break;
    }
  }
  
  const table = matchedTable || "[table]";
  
  if (actionLower.includes("create") || actionLower.includes("add") || actionLower.includes("insert") || actionLower.includes("register")) {
    return `INSERT INTO ${table}`;
  }
  if (actionLower.includes("update") || actionLower.includes("edit") || actionLower.includes("modify")) {
    return `UPDATE ${table} SET ... WHERE id = ?`;
  }
  if (actionLower.includes("delete") || actionLower.includes("remove")) {
    return `DELETE FROM ${table} WHERE id = ?`;
  }
  if (actionLower.includes("get") || actionLower.includes("fetch") || actionLower.includes("list") || actionLower.includes("view")) {
    return `SELECT * FROM ${table}`;
  }
  
  return `SELECT/INSERT/UPDATE ${table}`;
}
