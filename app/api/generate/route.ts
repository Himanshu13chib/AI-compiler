import { NextRequest } from "next/server";
import { runStage1 } from "@/lib/pipeline/stage1-intent";
import { runStage2 } from "@/lib/pipeline/stage2-architect";
import { runStage3 } from "@/lib/pipeline/stage3-schema";
import { runStage4 } from "@/lib/pipeline/stage4-validate";
import { runStage5 } from "@/lib/pipeline/stage5-assemble";

export const runtime = "nodejs";
export const maxDuration = 10; // Vercel Hobby plan max: 10 seconds

function sseEvent(type: string, data: unknown): string {
  return `data: ${JSON.stringify({ type, ...( typeof data === "object" ? data : { payload: data }) })}\n\n`;
}

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  
  if (!prompt || typeof prompt !== "string") {
    return new Response("Missing prompt", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stageTimings: Record<string, number> = {};

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(type, data)));
      };

      try {
        // ── Stage 1 ──────────────────────────────────────────────────────────
        send("stage_start", { stage: 1, name: "Intent Extractor" });
        const s1Start = Date.now();
        
        send("log", { stage: 1, message: "Analyzing your app description..." });
        const intent = await runStage1(prompt);
        stageTimings["stage1"] = Date.now() - s1Start;
        
        send("stage_complete", { stage: 1, data: intent, timeMs: stageTimings["stage1"] });
        send("log", { stage: 1, message: `✓ Identified: ${intent.appName} (${intent.appType}), complexity ${intent.complexityScore}/10` });

        // ── Stage 2 ──────────────────────────────────────────────────────────
        send("stage_start", { stage: 2, name: "System Architect" });
        const s2Start = Date.now();
        
        send("log", { stage: 2, message: "Designing system architecture..." });
        send("log", { stage: 2, message: `Modeling ${intent.features.length} features across ${intent.userRoles.length} roles...` });
        const architecture = await runStage2(intent);
        stageTimings["stage2"] = Date.now() - s2Start;
        
        send("stage_complete", { stage: 2, data: architecture, timeMs: stageTimings["stage2"] });
        send("log", { stage: 2, message: `✓ Designed ${architecture.entities.length} entities, ${architecture.flows.length} flows` });

        // ── Stage 3 ──────────────────────────────────────────────────────────
        send("stage_start", { stage: 3, name: "Schema Generator" });
        const s3Start = Date.now();
        
        send("log", { stage: 3, message: "Generating UI, API, Database, and Auth schemas..." });
        const schemas = await runStage3(intent, architecture);
        stageTimings["stage3"] = Date.now() - s3Start;
        
        send("stage_complete", { stage: 3, data: schemas, timeMs: stageTimings["stage3"] });
        send("log", { stage: 3, message: `✓ Generated ${schemas.uiSchema.pages.length} pages, ${schemas.apiSchema.endpoints.length} endpoints, ${schemas.dbSchema.tables.length} tables` });

        // ── Stage 4 ──────────────────────────────────────────────────────────
        send("stage_start", { stage: 4, name: "Validation + Repair Engine" });
        const s4Start = Date.now();
        
        const { schemas: validatedSchemas, validation } = await runStage4(
          schemas,
          (msg) => send("log", { stage: 4, message: msg })
        );
        stageTimings["stage4"] = Date.now() - s4Start;
        
        send("stage_complete", { stage: 4, data: validation, timeMs: stageTimings["stage4"] });
        send("log", { stage: 4, message: `✓ Consistency score: ${validation.consistencyScore}/100, ${validation.autoFixed.length} auto-fixed` });

        // ── Stage 5 ──────────────────────────────────────────────────────────
        send("stage_start", { stage: 5, name: "Final Assembler + Simulator" });
        const s5Start = Date.now();
        
        const result = await runStage5(
          intent,
          architecture,
          validatedSchemas,
          validation,
          stageTimings,
          (msg) => send("log", { stage: 5, message: msg })
        );
        stageTimings["stage5"] = Date.now() - s5Start;
        
        send("stage_complete", { stage: 5, data: result, timeMs: stageTimings["stage5"] });
        send("log", { stage: 5, message: `✓ Executability score: ${result.executabilityScore}/100` });

        // ── Final ─────────────────────────────────────────────────────────────
        send("pipeline_complete", { result });
        
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        send("pipeline_error", { message, stage: "unknown" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
