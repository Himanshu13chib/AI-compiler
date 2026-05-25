import { generateJSON } from "@/lib/utils/gemini";
import { Stage3OutputSchema, type Stage1Output, type Stage2Output, type Stage3Output } from "@/lib/pipeline/schemas";

const SYSTEM_PROMPT = `You are a full-stack architect generating production-grade schemas for a software application. You will generate 4 complete schemas simultaneously: UI, API, Database, and Auth.

RULES:
1. UI Schema: Every page needs route, layout type, required roles, components with props, SEO meta
2. API Schema: Every endpoint needs method, path, roles, request/response schemas, rate limits
3. DB Schema: PostgreSQL dialect, every table needs id (uuid PK), createdAt, updatedAt columns, proper indexes
4. Auth Schema: JWT or OAuth, complete role hierarchy, resource-action rules
5. All IDs must be UUIDs. All timestamps must be timestamptz.
6. API paths must follow REST conventions: /api/v1/resource, /api/v1/resource/:id
7. DB foreign keys must reference real tables
8. Auth rules must cover every API endpoint
9. Component types: Table, Form, Card, Chart, Modal, Button, Input, Select, DatePicker, FileUpload, RichText, Map, Calendar, Kanban, Timeline

IMPORTANT: Return ONLY valid JSON. Be comprehensive — missing schemas break the validation stage.`;

export async function runStage3(intent: Stage1Output, architecture: Stage2Output): Promise<Stage3Output> {
  const prompt = `Generate 4 complete production schemas for this application:

INTENT:
${JSON.stringify(intent, null, 2)}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Return a JSON object with EXACTLY these top-level keys:
{
  "uiSchema": {
    "pages": [{"name": "string", "route": "string", "title": "string", "description": "string", "layout": "dashboard|auth|landing|settings|detail", "requiredRoles": ["string"], "components": [{"id": "string", "type": "string", "label": "string", "dataSource": "string (optional)", "props": {}, "children": ["string (optional)"], "validations": ["string (optional)"]}], "seoMeta": {"title": "string", "description": "string"}}],
    "globalComponents": {"navbar": {}, "sidebar": {}, "footer": {}},
    "designTokens": {"primaryColor": "string", "theme": "light|dark|both"},
    "navigationStructure": {"main": ["string"], "secondary": ["string"]}
  },
  "apiSchema": {
    "baseUrl": "/api",
    "version": "v1",
    "endpoints": [{"id": "string", "method": "GET|POST|PUT|PATCH|DELETE", "path": "string", "summary": "string", "description": "string", "requiredRoles": ["string"], "requestBody": {"fields": [{"name": "string", "type": "string", "required": boolean, "validation": "string"}]}, "queryParams": [{"name": "string", "type": "string", "required": boolean, "description": "string"}], "responseBody": {"successSchema": {}, "errorSchema": {}}, "rateLimit": "string", "cacheable": boolean, "webhookTriggers": ["string"]}]
  },
  "dbSchema": {
    "dialect": "postgresql",
    "tables": [{"name": "string", "description": "string", "columns": [{"name": "string", "type": "string", "nullable": boolean, "unique": boolean, "primaryKey": boolean, "default": "string|null", "foreignKey": {"table": "string", "column": "string"}}], "indexes": [{"name": "string", "columns": ["string"], "unique": boolean}], "triggers": ["string"]}],
    "migrations": [{"order": number, "description": "string", "sql": "string"}],
    "seedData": [{"table": "string", "rows": [{}]}]
  },
  "authSchema": {
    "provider": "JWT|OAuth|both",
    "strategies": ["string"],
    "tokenConfig": {"accessExpiry": "string", "refreshExpiry": "string"},
    "roles": [{"name": "string", "inheritsFrom": "string (optional)", "description": "string"}],
    "rules": [{"resource": "string", "action": "string", "condition": "owner_only|role_based|public|admin_only"}],
    "premiumGating": [{"features": ["string"], "planRequired": "string"}]
  }
}`;

  const raw = await generateJSON<unknown>(prompt, SYSTEM_PROMPT);
  const result = Stage3OutputSchema.safeParse(raw);
  
  if (!result.success) {
    const fixed = coerceStage3(raw as Record<string, unknown>);
    const retry = Stage3OutputSchema.safeParse(fixed);
    if (!retry.success) {
      throw new Error(`Stage 3 validation failed: ${retry.error.message}`);
    }
    return retry.data;
  }
  
  return result.data;
}

function coerceStage3(raw: Record<string, unknown>): Record<string, unknown> {
  const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const validLayouts = ["dashboard", "auth", "landing", "settings", "detail"];
  const validConditions = ["owner_only", "role_based", "public", "admin_only"];
  
  const ui = (raw.uiSchema || {}) as Record<string, unknown>;
  const api = (raw.apiSchema || {}) as Record<string, unknown>;
  const db = (raw.dbSchema || {}) as Record<string, unknown>;
  const auth = (raw.authSchema || {}) as Record<string, unknown>;
  
  return {
    uiSchema: {
      ...ui,
      pages: Array.isArray(ui.pages) ? (ui.pages as Record<string, unknown>[]).map(p => ({
        ...p,
        layout: validLayouts.includes(p.layout as string) ? p.layout : "dashboard",
        components: Array.isArray(p.components) ? (p.components as Record<string, unknown>[]).map(c => ({
          ...c,
          id: typeof c.id === "string" ? c.id : String(c.id || Math.random().toString(36).slice(2)),
          type: typeof c.type === "string" ? c.type : "Card",
          label: typeof c.label === "string" ? c.label : String(c.label || ""),
          props: (c.props && typeof c.props === "object" && !Array.isArray(c.props)) ? c.props : {},
          // Normalize children: flatten objects to their id/label/string representation
          children: Array.isArray(c.children)
            ? (c.children as unknown[]).map(ch =>
                typeof ch === "string" ? ch :
                typeof ch === "object" && ch !== null
                  ? ((ch as Record<string, unknown>).id as string) ||
                    ((ch as Record<string, unknown>).label as string) ||
                    JSON.stringify(ch)
                  : String(ch)
              )
            : undefined,
          validations: Array.isArray(c.validations)
            ? (c.validations as unknown[]).map(v => typeof v === "string" ? v : String(v))
            : undefined,
        })) : [],
        requiredRoles: Array.isArray(p.requiredRoles) ? p.requiredRoles : [],
        seoMeta: p.seoMeta || { title: p.title || "", description: p.description || "" },
      })) : [],
      globalComponents: ui.globalComponents || { navbar: {}, sidebar: {}, footer: {} },
      designTokens: ui.designTokens || { primaryColor: "#6366f1", theme: "dark" },
      navigationStructure: ui.navigationStructure || { main: [], secondary: [] },
    },
    apiSchema: {
      baseUrl: api.baseUrl || "/api",
      version: "v1",
      endpoints: Array.isArray(api.endpoints) ? (api.endpoints as Record<string, unknown>[]).map(e => ({
        ...e,
        method: validMethods.includes(e.method as string) ? e.method : "GET",
        cacheable: Boolean(e.cacheable),
        requiredRoles: Array.isArray(e.requiredRoles) ? e.requiredRoles : [],
        responseBody: e.responseBody || { successSchema: {}, errorSchema: {} },
      })) : [],
    },
    dbSchema: {
      dialect: "postgresql",
      tables: Array.isArray(db.tables) ? (db.tables as Record<string, unknown>[]).map(t => {
        const cols = Array.isArray(t.columns) ? t.columns as Record<string, unknown>[] : [];
        const hasId = cols.some(c => c.name === "id");
        const hasCreatedAt = cols.some(c => c.name === "createdAt" || c.name === "created_at");
        const hasUpdatedAt = cols.some(c => c.name === "updatedAt" || c.name === "updated_at");
        
        const mandatoryColumns = [];
        if (!hasId) mandatoryColumns.push({ name: "id", type: "uuid", nullable: false, unique: true, primaryKey: true, default: "gen_random_uuid()" });
        if (!hasCreatedAt) mandatoryColumns.push({ name: "created_at", type: "timestamptz", nullable: false, unique: false, primaryKey: false, default: "now()" });
        if (!hasUpdatedAt) mandatoryColumns.push({ name: "updated_at", type: "timestamptz", nullable: false, unique: false, primaryKey: false, default: "now()" });
        
        return {
          ...t,
          columns: [...mandatoryColumns, ...cols],
          indexes: Array.isArray(t.indexes) ? t.indexes : [],
          triggers: Array.isArray(t.triggers) ? t.triggers : [],
        };
      }) : [],
      migrations: Array.isArray(db.migrations) ? db.migrations : [],
      seedData: Array.isArray(db.seedData) ? db.seedData : [],
    },
    authSchema: {
      provider: ["JWT", "OAuth", "both"].includes(auth.provider as string) ? auth.provider : "JWT",
      strategies: Array.isArray(auth.strategies) ? auth.strategies : ["local"],
      tokenConfig: auth.tokenConfig || { accessExpiry: "15m", refreshExpiry: "7d" },
      roles: Array.isArray(auth.roles) ? auth.roles : [],
      rules: Array.isArray(auth.rules) ? (auth.rules as Record<string, unknown>[]).map(r => ({
        ...r,
        condition: validConditions.includes(r.condition as string) ? r.condition : "role_based",
      })) : [],
      premiumGating: Array.isArray(auth.premiumGating) ? auth.premiumGating : [],
    },
  };
}
