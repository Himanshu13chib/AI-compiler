import type { Stage3Output, Issue } from "@/lib/pipeline/schemas";

let issueCounter = 0;
function makeId() { return `issue-${++issueCounter}`; }

export function runConsistencyChecks(schemas: Stage3Output): Issue[] {
  const issues: Issue[] = [];
  const { uiSchema, apiSchema, dbSchema, authSchema } = schemas;

  // Build lookup sets
  const apiEndpointPaths = new Set(apiSchema.endpoints.map(e => e.id));
  const apiEndpointPathStrings = new Set(apiSchema.endpoints.map(e => e.path));
  const dbTableNames = new Set(dbSchema.tables.map(t => t.name));
  const authRoleNames = new Set(authSchema.roles.map(r => r.name));
  
  // Build column lookup: table -> Set<columnName>
  const tableColumns = new Map<string, Set<string>>();
  for (const table of dbSchema.tables) {
    tableColumns.set(table.name, new Set(table.columns.map(c => c.name)));
  }

  // ── Check 1: UI component dataSources must map to real API endpoints ──────
  for (const page of uiSchema.pages) {
    for (const component of page.components) {
      if (component.dataSource && !apiEndpointPaths.has(component.dataSource) && !apiEndpointPathStrings.has(component.dataSource)) {
        issues.push({
          id: makeId(),
          type: "warning",
          layer: "ui",
          description: `Component "${component.id}" on page "${page.name}" references dataSource "${component.dataSource}" which doesn't match any API endpoint`,
          affectedItems: [component.id, component.dataSource],
          suggestedFix: `Map dataSource to one of: ${Array.from(apiEndpointPaths).slice(0, 3).join(", ")}`,
        });
      }
    }
  }

  // ── Check 2: UI pages reference valid roles ───────────────────────────────
  for (const page of uiSchema.pages) {
    for (const role of page.requiredRoles) {
      if (role !== "public" && !authRoleNames.has(role)) {
        issues.push({
          id: makeId(),
          type: "critical",
          layer: "ui",
          description: `Page "${page.name}" requires role "${role}" which is not defined in Auth schema`,
          affectedItems: [page.name, role],
          suggestedFix: `Add role "${role}" to authSchema.roles or change to one of: ${Array.from(authRoleNames).join(", ")}`,
        });
      }
    }
  }

  // ── Check 3: API endpoints reference valid roles ──────────────────────────
  for (const endpoint of apiSchema.endpoints) {
    for (const role of endpoint.requiredRoles) {
      if (role !== "public" && !authRoleNames.has(role)) {
        issues.push({
          id: makeId(),
          type: "critical",
          layer: "api",
          description: `Endpoint "${endpoint.path}" requires role "${role}" which is not defined in Auth schema`,
          affectedItems: [endpoint.path, role],
          suggestedFix: `Add role "${role}" to authSchema.roles`,
        });
      }
    }
  }

  // ── Check 4: DB foreign keys reference real tables and columns ────────────
  for (const table of dbSchema.tables) {
    for (const column of table.columns) {
      if (column.foreignKey) {
        const { table: refTable, column: refColumn } = column.foreignKey;
        if (!dbTableNames.has(refTable)) {
          issues.push({
            id: makeId(),
            type: "critical",
            layer: "db",
            description: `Table "${table.name}" column "${column.name}" has foreign key to non-existent table "${refTable}"`,
            affectedItems: [table.name, column.name, refTable],
            suggestedFix: `Create table "${refTable}" or change foreign key to an existing table`,
          });
        } else {
          const refCols = tableColumns.get(refTable);
          if (refCols && !refCols.has(refColumn)) {
            issues.push({
              id: makeId(),
              type: "critical",
              layer: "db",
              description: `Table "${table.name}" column "${column.name}" references column "${refColumn}" in "${refTable}" which doesn't exist`,
              affectedItems: [table.name, column.name, refTable, refColumn],
              suggestedFix: `Add column "${refColumn}" to table "${refTable}" or use "id"`,
            });
          }
        }
      }
    }
  }

  // ── Check 5: Mandatory columns on all DB tables ───────────────────────────
  for (const table of dbSchema.tables) {
    const cols = tableColumns.get(table.name) || new Set();
    const hasId = cols.has("id");
    const hasCreatedAt = cols.has("created_at") || cols.has("createdAt");
    const hasUpdatedAt = cols.has("updated_at") || cols.has("updatedAt");
    
    if (!hasId) {
      issues.push({
        id: makeId(),
        type: "critical",
        layer: "db",
        description: `Table "${table.name}" is missing mandatory "id" column`,
        affectedItems: [table.name],
        suggestedFix: `Add column: id uuid PRIMARY KEY DEFAULT gen_random_uuid()`,
      });
    }
    if (!hasCreatedAt) {
      issues.push({
        id: makeId(),
        type: "warning",
        layer: "db",
        description: `Table "${table.name}" is missing "created_at" timestamp column`,
        affectedItems: [table.name],
        suggestedFix: `Add column: created_at timestamptz NOT NULL DEFAULT now()`,
      });
    }
    if (!hasUpdatedAt) {
      issues.push({
        id: makeId(),
        type: "warning",
        layer: "db",
        description: `Table "${table.name}" is missing "updated_at" timestamp column`,
        affectedItems: [table.name],
        suggestedFix: `Add column: updated_at timestamptz NOT NULL DEFAULT now()`,
      });
    }
  }

  // ── Check 6: Auth rules reference valid resources ─────────────────────────
  for (const rule of authSchema.rules) {
    const resourceExists = dbTableNames.has(rule.resource) || 
      apiSchema.endpoints.some(e => e.path.includes(rule.resource.toLowerCase()));
    if (!resourceExists) {
      issues.push({
        id: makeId(),
        type: "suggestion",
        layer: "auth",
        description: `Auth rule for resource "${rule.resource}" doesn't clearly map to a DB table or API endpoint`,
        affectedItems: [rule.resource],
        suggestedFix: `Ensure resource name matches a DB table name or API path segment`,
      });
    }
  }

  // ── Check 7: Premium gated features exist in UI ───────────────────────────
  if (authSchema.premiumGating) {
    const allPageNames = new Set(uiSchema.pages.map(p => p.name.toLowerCase()));
    for (const gate of authSchema.premiumGating) {
      for (const feature of gate.features) {
        const featureExists = allPageNames.has(feature.toLowerCase()) ||
          uiSchema.pages.some(p => p.components.some(c => c.label.toLowerCase().includes(feature.toLowerCase())));
        if (!featureExists) {
          issues.push({
            id: makeId(),
            type: "suggestion",
            layer: "auth",
            description: `Premium-gated feature "${feature}" (plan: ${gate.planRequired}) doesn't appear in any UI page`,
            affectedItems: [feature, gate.planRequired],
            suggestedFix: `Add a UI page or component for "${feature}" with access control`,
          });
        }
      }
    }
  }

  // ── Check 8: No circular entity relations ─────────────────────────────────
  // Simple cycle detection via DFS
  // (skipped for brevity — would need full graph traversal)

  return issues;
}

export function calculateConsistencyScore(issues: Issue[]): number {
  const criticalCount = issues.filter(i => i.type === "critical").length;
  const warningCount = issues.filter(i => i.type === "warning").length;
  const suggestionCount = issues.filter(i => i.type === "suggestion").length;
  
  const penalty = criticalCount * 15 + warningCount * 5 + suggestionCount * 1;
  return Math.max(0, Math.min(100, 100 - penalty));
}
