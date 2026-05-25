import { generateJSON } from "@/lib/utils/gemini";
import { Stage2OutputSchema, type Stage1Output, type Stage2Output } from "@/lib/pipeline/schemas";

const SYSTEM_PROMPT = `You are a senior software architect with 15+ years of experience designing production systems. Your job is to design the complete system architecture for an application based on its intent.

RULES:
1. Design entities with COMPLETE field definitions — include types (uuid, varchar, text, integer, boolean, timestamp, jsonb, decimal), constraints, indexes
2. Every entity MUST have: id (uuid, primary key), createdAt (timestamp), updatedAt (timestamp)
3. Define ALL user flows end-to-end — not just happy path. Include error states, edge cases, rollback scenarios
4. Design a complete role-permission matrix — every role, every entity, every action
5. Identify cross-cutting concerns: caching strategy with TTL, rate limiting per endpoint type, audit logging events
6. If complexity > 7, suggest microservice boundaries in architectureNotes
7. Relations must be explicit: hasMany, belongsTo, manyToMany (with junction table)
8. Business rules must be specific and enforceable (not vague)
9. Flow steps must include conditions and error states

IMPORTANT: Return ONLY valid JSON. Be thorough — a shallow architecture is worse than no architecture.`;

export async function runStage2(intent: Stage1Output): Promise<Stage2Output> {
  const prompt = `Design the complete system architecture for this application:

APP INTENT:
${JSON.stringify(intent, null, 2)}

Return a JSON object with these exact fields:
{
  "entities": [{
    "name": "string",
    "description": "string",
    "fields": [{"name": "string", "type": "string", "nullable": boolean, "unique": boolean, "indexed": boolean, "default": "string|null", "validation": "string|null"}],
    "relations": [{"type": "hasMany|belongsTo|manyToMany", "target": "string", "through": "string (optional for manyToMany)"}],
    "businessRules": ["string"]
  }],
  "flows": [{
    "name": "string",
    "trigger": "string",
    "actors": ["string"],
    "steps": [{"order": number, "action": "string", "actor": "string", "condition": "string (optional)", "errorState": "string (optional)"}],
    "successOutcome": "string",
    "failureOutcome": "string"
  }],
  "rolePermissionMatrix": [{
    "role": "string",
    "permissions": [{"entity": "string", "actions": ["create|read|update|delete|export"]}]
  }],
  "crossCuttingConcerns": {
    "caching": {"strategy": "string", "ttl": "string", "invalidationRules": ["string"]},
    "rateLimiting": {"endpoints": ["string"], "limits": ["string"]},
    "auditLogging": {"events": ["string"]}
  },
  "architectureNotes": ["string"]
}

Design for ${intent.complexityScore >= 7 ? "high complexity — consider microservices" : "moderate complexity — monolith is fine"}.
Include ${intent.hasRealtime ? "real-time event flows (WebSocket/SSE)" : "standard REST flows"}.
Include ${intent.hasPayments ? "payment processing flows with webhook handling" : "no payment flows"}.`;

  const raw = await generateJSON<unknown>(prompt, SYSTEM_PROMPT);
  const result = Stage2OutputSchema.safeParse(raw);
  
  if (!result.success) {
    const fixed = coerceStage2(raw as Record<string, unknown>);
    const retry = Stage2OutputSchema.safeParse(fixed);
    if (!retry.success) {
      throw new Error(`Stage 2 validation failed: ${retry.error.message}`);
    }
    return retry.data;
  }
  
  return result.data;
}

function coerceStage2(raw: Record<string, unknown>): Record<string, unknown> {
  const validActions = ["create", "read", "update", "delete", "export"];
  const validRelTypes = ["hasMany", "belongsTo", "manyToMany"];
  
  return {
    ...raw,
    entities: Array.isArray(raw.entities) ? raw.entities.map((e: unknown) => {
      const entity = e as Record<string, unknown>;
      return {
        ...entity,
        fields: Array.isArray(entity.fields) ? entity.fields.map((f: unknown) => {
          const field = f as Record<string, unknown>;
          return {
            ...field,
            name: typeof field.name === "string" ? field.name : "unknown_field",
            type: typeof field.type === "string" ? field.type : "varchar",
            nullable: typeof field.nullable === "boolean" ? field.nullable : false,
            unique: typeof field.unique === "boolean" ? field.unique : false,
            indexed: typeof field.indexed === "boolean" ? field.indexed : false,
            default: typeof field.default === "string" ? field.default : null,
            validation: typeof field.validation === "string" ? field.validation : null,
          };
        }) : [],
        relations: Array.isArray(entity.relations) ? (entity.relations as Record<string, unknown>[])
          .filter(r => r && typeof r.target === "string")
          .map(r => ({
            ...r,
            type: validRelTypes.includes(r.type as string) ? r.type : "hasMany",
          })) : [],
        businessRules: Array.isArray(entity.businessRules) ? entity.businessRules : [],
      };
    }) : [],
    flows: Array.isArray(raw.flows) ? raw.flows.map((f: unknown) => {
      const flow = f as Record<string, unknown>;
      return {
        ...flow,
        name: typeof flow.name === "string" ? flow.name : "unnamed_flow",
        trigger: typeof flow.trigger === "string" ? flow.trigger : "manual",
        actors: Array.isArray(flow.actors) ? flow.actors.map(String) : [],
        successOutcome: typeof flow.successOutcome === "string" ? flow.successOutcome : "Success",
        failureOutcome: typeof flow.failureOutcome === "string" ? flow.failureOutcome : "Failure",
        steps: Array.isArray(flow.steps) ? flow.steps.map((s: unknown, index: number) => {
          const step = s as Record<string, unknown>;
          return {
            ...step,
            order: typeof step.order === "number" ? step.order : index + 1,
            action: typeof step.action === "string" ? step.action : "Action step",
            actor: typeof step.actor === "string" ? step.actor : "System",
          };
        }) : [],
      };
    }) : [],
    rolePermissionMatrix: Array.isArray(raw.rolePermissionMatrix) ? (raw.rolePermissionMatrix as Record<string, unknown>[]).map(r => ({
      ...r,
      role: typeof r.role === "string" ? r.role : "User",
      permissions: Array.isArray(r.permissions) ? (r.permissions as Record<string, unknown>[]).map(p => ({
        ...p,
        entity: typeof p.entity === "string" ? p.entity : "unknown",
        actions: Array.isArray(p.actions) ? (p.actions as string[]).filter(a => validActions.includes(a)) : ["read"],
      })) : [],
    })) : [],
    crossCuttingConcerns: {
      caching: {
        strategy: typeof (raw.crossCuttingConcerns as any)?.caching?.strategy === "string" ? (raw.crossCuttingConcerns as any).caching.strategy : "Redis",
        ttl: typeof (raw.crossCuttingConcerns as any)?.caching?.ttl === "string" ? (raw.crossCuttingConcerns as any).caching.ttl : "5m",
        invalidationRules: Array.isArray((raw.crossCuttingConcerns as any)?.caching?.invalidationRules) ? (raw.crossCuttingConcerns as any).caching.invalidationRules.map(String) : [],
      },
      rateLimiting: {
        endpoints: Array.isArray((raw.crossCuttingConcerns as any)?.rateLimiting?.endpoints) ? (raw.crossCuttingConcerns as any).rateLimiting.endpoints.map(String) : [],
        limits: Array.isArray((raw.crossCuttingConcerns as any)?.rateLimiting?.limits) ? (raw.crossCuttingConcerns as any).rateLimiting.limits.map(String) : [],
      },
      auditLogging: {
        events: Array.isArray((raw.crossCuttingConcerns as any)?.auditLogging?.events) ? (raw.crossCuttingConcerns as any).auditLogging.events.map(String) : [],
      },
    },
    architectureNotes: Array.isArray(raw.architectureNotes) ? raw.architectureNotes : [],
  };
}
