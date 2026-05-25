import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/utils/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ELI5Response {
  appSummary: string;
  whatItDoes: string;
  howItWorks: string[];
  whoUsesIt: string[];
  coolParts: string[];
  analogy: string;
}

export async function POST(req: NextRequest) {
  try {
    const { result } = await req.json();

    if (!result) {
      return NextResponse.json({ error: "Missing result" }, { status: 400 });
    }

    const { intent, architecture, schemas } = result.masterConfig;

    const systemInstruction = `You explain complex technical systems to a 5-year-old. You use simple words, fun analogies, and avoid all jargon. You make technology feel magical and exciting, not scary or complicated.`;

    const prompt = `Explain this app to a 5-year-old. Use simple words, fun analogies, and make it exciting.

APP: ${intent.appName} (${intent.appType})
TAGLINE: ${intent.tagline}
FEATURES: ${(intent.features as Array<{ name: string; description: string }>).map(f => f.name).join(", ")}
USERS: ${(intent.userRoles as Array<{ name: string }>).map(r => r.name).join(", ")}
PAGES: ${(schemas.uiSchema.pages as Array<{ name: string }>).map(p => p.name).join(", ")}
ENTITIES: ${(architecture.entities as Array<{ name: string }>).map(e => e.name).join(", ")}
HAS PAYMENTS: ${intent.hasPayments}
HAS REALTIME: ${intent.hasRealtime}

Return ONLY valid JSON:
{
  "appSummary": "One sentence, like explaining to a 5-year-old what this app is",
  "whatItDoes": "2-3 sentences explaining what the app does using a fun analogy (like comparing it to a toy or game)",
  "howItWorks": ["Step 1 in simple words", "Step 2 in simple words", "Step 3 in simple words"],
  "whoUsesIt": ["Who uses it and what they do, in simple words", "Another type of user"],
  "coolParts": ["One cool feature explained simply", "Another cool feature", "Another one"],
  "analogy": "A complete analogy comparing the whole app to something a child would understand (like a toy store, playground, or school)"
}`;

    const data = await generateJSON<ELI5Response>(prompt, systemInstruction);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Explanation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
