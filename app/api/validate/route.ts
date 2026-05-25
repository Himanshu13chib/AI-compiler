import { NextRequest, NextResponse } from "next/server";
import { runConsistencyChecks, calculateConsistencyScore } from "@/lib/utils/consistency";
import { Stage3OutputSchema } from "@/lib/pipeline/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = Stage3OutputSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid schema", details: result.error.message }, { status: 400 });
    }
    
    const issues = runConsistencyChecks(result.data);
    const score = calculateConsistencyScore(issues);
    
    return NextResponse.json({
      passed: issues.filter(i => i.type === "critical").length === 0,
      issues,
      consistencyScore: score,
    });
  } catch (error) {
    return NextResponse.json({ error: "Validation failed", details: String(error) }, { status: 500 });
  }
}
