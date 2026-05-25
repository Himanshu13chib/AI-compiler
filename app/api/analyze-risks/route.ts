import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/utils/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RiskItem {
  category: "scalability" | "security" | "missing" | "over-engineered" | "under-engineered";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  recommendation: string;
}

interface RisksResponse {
  risks: RiskItem[];
}

export async function POST(req: NextRequest) {
  try {
    const { result } = await req.json();

    if (!result) {
      return NextResponse.json({ error: "Missing result" }, { status: 400 });
    }

    const { intent, architecture, schemas, validation } = result.masterConfig;

    const systemInstruction = `You are a senior software architect with 15+ years of experience reviewing production systems at companies like Stripe, Airbnb, and Netflix. You give brutally honest, specific, actionable feedback. You always reference actual names from the config — never give generic advice.`;

    const prompt = `Analyze this app configuration and identify real, actionable risks. Be specific — reference actual entity names, endpoint counts, table names from the config.

APP SUMMARY:
- Name: ${intent.appName} (${intent.appType})
- Complexity: ${intent.complexityScore}/10
- Features: ${(intent.features as Array<{ name: string }>).map(f => f.name).join(", ")}
- Has payments: ${intent.hasPayments}, Has realtime: ${intent.hasRealtime}, Has auth: ${intent.hasAuth}
- User roles: ${(intent.userRoles as Array<{ name: string }>).map(r => r.name).join(", ")}

ARCHITECTURE:
- Entities (${architecture.entities.length}): ${(architecture.entities as Array<{ name: string }>).map(e => e.name).join(", ")}
- Flows (${architecture.flows.length}): ${(architecture.flows as Array<{ name: string }>).map(f => f.name).join(", ")}

SCHEMAS:
- Pages: ${schemas.uiSchema.pages.length} (${(schemas.uiSchema.pages as Array<{ name: string }>).map(p => p.name).join(", ")})
- API Endpoints: ${schemas.apiSchema.endpoints.length}
- DB Tables: ${schemas.dbSchema.tables.length} (${(schemas.dbSchema.tables as Array<{ name: string }>).map(t => t.name).join(", ")})
- Auth provider: ${schemas.authSchema.provider}, Roles: ${(schemas.authSchema.roles as Array<{ name: string }>).map(r => r.name).join(", ")}
- Endpoints without rate limiting: ${(schemas.apiSchema.endpoints as Array<{ rateLimit?: string }>).filter(e => !e.rateLimit).length}

VALIDATION:
- Consistency score: ${validation.consistencyScore}/100
- Critical issues: ${validation.criticalIssues.length}
- Unresolved issues: ${validation.unresolvedIssues.length}

Identify 6-10 specific, actionable risks. For each risk:
- Be specific (mention actual entity/endpoint/table names from above)
- Give a concrete recommendation (not generic advice)
- Categorize correctly:
  * scalability: will break at scale or under load
  * security: auth gaps, data exposure, injection risks
  * missing: important feature not included that this type of app needs
  * over-engineered: unnecessary complexity for the stated use case
  * under-engineered: too simple for stated requirements

Return ONLY valid JSON matching this exact schema:
{
  "risks": [
    {
      "category": "scalability" | "security" | "missing" | "over-engineered" | "under-engineered",
      "severity": "high" | "medium" | "low",
      "title": "Short descriptive title",
      "description": "Specific description referencing actual config details",
      "recommendation": "Concrete, actionable recommendation with specific technology or pattern"
    }
  ]
}`;

    const data = await generateJSON<RisksResponse>(prompt, systemInstruction);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
