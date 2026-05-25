import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/utils/gemini";

export const runtime = "nodejs";
export const maxDuration = 120;

interface RefinementPatch {
  summary: string;
  changes: Array<{
    layer: "intent" | "architecture" | "api" | "database" | "auth" | "ui";
    type: "add" | "modify" | "remove";
    target: string;
    description: string;
    patch: Record<string, unknown>;
  }>;
  warnings: string[];
  newFeatures: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { result, instruction, history } = await req.json();

    if (!result || !instruction) {
      return NextResponse.json({ error: "Missing result or instruction" }, { status: 400 });
    }

    const { intent, architecture, schemas } = result.masterConfig;

    const systemInstruction = `You are a surgical app configuration editor. Given an existing app config and a user instruction, you produce a minimal patch that applies the requested change without breaking anything else. You always explain what you changed and warn about potential side effects.`;

    const conversationContext = history && history.length > 0
      ? `\nPREVIOUS REFINEMENTS:\n${(history as Array<{ instruction: string; summary: string }>).map(h => `- User: "${h.instruction}" → ${h.summary}`).join("\n")}\n`
      : "";

    const prompt = `Apply this refinement instruction to the app configuration surgically.

CURRENT APP: ${intent.appName} (${intent.appType})
CURRENT STATE:
- Features: ${(intent.features as Array<{ name: string }>).map(f => f.name).join(", ")}
- Entities: ${(architecture.entities as Array<{ name: string }>).map(e => e.name).join(", ")}
- API Endpoints: ${schemas.apiSchema.endpoints.length}
- DB Tables: ${schemas.dbSchema.tables.length}
- Pages: ${(schemas.uiSchema.pages as Array<{ name: string }>).map(p => p.name).join(", ")}
- Auth roles: ${(schemas.authSchema.roles as Array<{ name: string }>).map(r => r.name).join(", ")}
${conversationContext}
USER INSTRUCTION: "${instruction}"

Analyze what needs to change and produce a surgical patch. Be specific about what changes in each layer.

Return ONLY valid JSON:
{
  "summary": "One sentence describing what was changed",
  "changes": [
    {
      "layer": "intent" | "architecture" | "api" | "database" | "auth" | "ui",
      "type": "add" | "modify" | "remove",
      "target": "Name of the thing being changed (e.g. 'User entity', 'POST /api/payments', 'payments table')",
      "description": "What specifically changed and why",
      "patch": { "key": "value pairs of what changed" }
    }
  ],
  "warnings": ["Any potential side effects or things the user should know"],
  "newFeatures": ["Any new features that were added as a result"]
}`;

    const data = await generateJSON<RefinementPatch>(prompt, systemInstruction);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refinement failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
