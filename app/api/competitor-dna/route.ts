import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/utils/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

interface CompetitorProfile {
  name: string;
  tagline: string;
  dnaScores: {
    complexity: number;
    scalability: number;
    security: number;
    uxFocus: number;
    apiRichness: number;
    dataModel: number;
    authSophistication: number;
    realtimeCapability: number;
  };
  strengths: string[];
  weaknesses: string[];
  differentiator: string;
}

interface CompetitorDNAResponse {
  competitors: CompetitorProfile[];
  yourApp: CompetitorProfile;
  insights: string[];
  uniqueAdvantages: string[];
  gaps: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { result } = await req.json();

    if (!result) {
      return NextResponse.json({ error: "Missing result" }, { status: 400 });
    }

    const { intent, architecture, schemas } = result.masterConfig;

    const systemInstruction = `You are a product strategist and competitive analyst who deeply understands SaaS products, their architectures, and market positioning. You give honest, data-driven competitive analysis.`;

    const prompt = `Perform a competitive DNA analysis for this app against its top 3 real-world competitors.

APP BEING ANALYZED:
- Name: ${intent.appName} (${intent.appType})
- Tagline: ${intent.tagline}
- Features: ${(intent.features as Array<{ name: string }>).map(f => f.name).join(", ")}
- Complexity: ${intent.complexityScore}/10
- Has payments: ${intent.hasPayments}, Has realtime: ${intent.hasRealtime}
- Entities: ${(architecture.entities as Array<{ name: string }>).map(e => e.name).join(", ")}
- API endpoints: ${schemas.apiSchema.endpoints.length}
- DB tables: ${schemas.dbSchema.tables.length}
- Auth: ${schemas.authSchema.provider}, roles: ${(schemas.authSchema.roles as Array<{ name: string }>).map(r => r.name).join(", ")}

Score each app (0-10) on these 8 DNA dimensions:
1. complexity: Overall system complexity
2. scalability: How well it scales to millions of users
3. security: Auth, permissions, data protection sophistication
4. uxFocus: How much the design prioritizes user experience
5. apiRichness: API surface area and developer-friendliness
6. dataModel: Sophistication of the data model
7. authSophistication: Role hierarchy, permissions, SSO complexity
8. realtimeCapability: Real-time features, WebSockets, live updates

Identify the top 3 REAL competitors for this type of app (use actual product names like Salesforce, HubSpot, Linear, Notion, etc.).

Return ONLY valid JSON:
{
  "competitors": [
    {
      "name": "Real competitor name",
      "tagline": "Their actual tagline or positioning",
      "dnaScores": {
        "complexity": 0-10,
        "scalability": 0-10,
        "security": 0-10,
        "uxFocus": 0-10,
        "apiRichness": 0-10,
        "dataModel": 0-10,
        "authSophistication": 0-10,
        "realtimeCapability": 0-10
      },
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "differentiator": "What makes them unique in one sentence"
    }
  ],
  "yourApp": {
    "name": "${intent.appName}",
    "tagline": "${intent.tagline}",
    "dnaScores": {
      "complexity": score based on actual config,
      "scalability": score based on actual config,
      "security": score based on actual config,
      "uxFocus": score based on actual config,
      "apiRichness": score based on actual config,
      "dataModel": score based on actual config,
      "authSophistication": score based on actual config,
      "realtimeCapability": score based on actual config
    },
    "strengths": ["strength based on config", "strength 2", "strength 3"],
    "weaknesses": ["weakness based on config", "weakness 2"],
    "differentiator": "What makes this app unique vs competitors"
  },
  "insights": ["Key insight about competitive positioning", "Another insight"],
  "uniqueAdvantages": ["Where your app beats competitors", "Another advantage"],
  "gaps": ["Where competitors are stronger", "Another gap to address"]
}`;

    const data = await generateJSON<CompetitorDNAResponse>(prompt, systemInstruction);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
