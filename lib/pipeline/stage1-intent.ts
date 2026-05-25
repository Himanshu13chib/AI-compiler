import { generateJSON } from "@/lib/utils/gemini";
import { Stage1OutputSchema, type Stage1Output } from "@/lib/pipeline/schemas";

const SYSTEM_PROMPT = `You are an expert product analyst and requirements engineer. Your job is to analyze raw user input describing a software application and extract a precise, structured intent object.

RULES:
1. Identify the core app type from: CRM, SaaS, Marketplace, Social, Tool, E-commerce, Healthcare, FinTech, EdTech, HRTech, LegalTech, PropTech, FoodTech, LogisticsTech, GamePlatform, MediaPlatform, DevTool, Analytics, IoT, Blockchain
2. Extract EVERY feature mentioned, including implied ones (e.g., "CRM" implies contacts, pipeline, notes, activity log)
3. Detect ambiguities — things that are unclear or contradictory
4. Generate clarifying questions if the input is too vague (less than 20 words or missing domain context)
5. Infer missing but obvious features based on the app type
6. Assign a complexity score 1-10 with detailed reasoning
7. Generate a compelling one-liner tagline for the app
8. Classify features as: core (must-have), secondary (important), nice-to-have (optional)
9. Define user roles with access levels 1-5 (1=read-only, 5=super-admin)
10. Detect technical requirements: payments, auth, realtime, file upload, notifications, analytics

IMPORTANT: Return ONLY valid JSON matching the exact schema. No markdown, no explanation.`;

export async function runStage1(userInput: string): Promise<Stage1Output> {
  const prompt = `Analyze this app description and extract the structured intent:

USER INPUT:
"${userInput}"

Return a JSON object with these exact fields:
{
  "appName": "string - inferred or extracted app name",
  "appType": "one of the 20 app types",
  "tagline": "compelling one-liner",
  "features": [{"name": "string", "description": "string", "priority": "core|secondary|nice-to-have"}],
  "userRoles": [{"name": "string", "description": "string", "accessLevel": 1-5}],
  "hasPayments": boolean,
  "hasAuth": boolean,
  "hasRealtime": boolean,
  "hasFileUpload": boolean,
  "hasNotifications": boolean,
  "hasAnalytics": boolean,
  "complexityScore": 1-10,
  "complexityReasoning": "detailed explanation",
  "ambiguities": ["list of unclear things"],
  "clarifyingQuestions": ["questions if input is vague"],
  "inferredFeatures": ["features you added that user didn't mention"],
  "assumptions": ["assumptions you made"]
}`;

  const raw = await generateJSON<unknown>(prompt, SYSTEM_PROMPT);
  const result = Stage1OutputSchema.safeParse(raw);
  
  if (!result.success) {
    // Attempt to coerce and fix common issues
    const fixed = coerceStage1(raw as Record<string, unknown>);
    const retry = Stage1OutputSchema.safeParse(fixed);
    if (!retry.success) {
      throw new Error(`Stage 1 validation failed: ${retry.error.message}`);
    }
    return retry.data;
  }
  
  return result.data;
}

function coerceStage1(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    ...raw,
    appType: validateAppType(raw.appType as string),
    complexityScore: Math.min(10, Math.max(1, Number(raw.complexityScore) || 5)),
    features: Array.isArray(raw.features) ? raw.features.map((f: unknown) => {
      const feat = f as Record<string, unknown>;
      return {
        ...feat,
        priority: ["core", "secondary", "nice-to-have"].includes(feat.priority as string)
          ? feat.priority
          : "secondary",
      };
    }) : [],
    userRoles: Array.isArray(raw.userRoles) ? raw.userRoles.map((r: unknown) => {
      const role = r as Record<string, unknown>;
      return {
        ...role,
        accessLevel: Math.min(5, Math.max(1, Number(role.accessLevel) || 3)),
      };
    }) : [],
    ambiguities: Array.isArray(raw.ambiguities) ? raw.ambiguities : [],
    clarifyingQuestions: Array.isArray(raw.clarifyingQuestions) ? raw.clarifyingQuestions : [],
    inferredFeatures: Array.isArray(raw.inferredFeatures) ? raw.inferredFeatures : [],
    assumptions: Array.isArray(raw.assumptions) ? raw.assumptions : [],
  };
}

const VALID_APP_TYPES = [
  "CRM", "SaaS", "Marketplace", "Social", "Tool", "E-commerce", "Healthcare",
  "FinTech", "EdTech", "HRTech", "LegalTech", "PropTech", "FoodTech", "LogisticsTech",
  "GamePlatform", "MediaPlatform", "DevTool", "Analytics", "IoT", "Blockchain"
];

function validateAppType(type: string): string {
  if (VALID_APP_TYPES.includes(type)) return type;
  const lower = (type || "").toLowerCase();
  const match = VALID_APP_TYPES.find(t => t.toLowerCase().includes(lower) || lower.includes(t.toLowerCase()));
  return match || "Tool";
}
