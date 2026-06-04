import { NextRequest } from "next/server";
import { EVAL_DATASET } from "@/lib/evaluation/dataset";
import { runStage1 } from "@/lib/pipeline/stage1-intent";
import { runStage2 } from "@/lib/pipeline/stage2-architect";
import { runStage3 } from "@/lib/pipeline/stage3-schema";
import { runStage4 } from "@/lib/pipeline/stage4-validate";
import { runStage5 } from "@/lib/pipeline/stage5-assemble";
import type { PromptResult } from "@/lib/evaluation/metrics";

export const runtime = "nodejs";
export const maxDuration = 10; // Vercel Hobby plan max: 10 seconds

function sseEvent(type: string, data: unknown): string {
  return `data: ${JSON.stringify({ type, ...(typeof data === "object" ? data : { payload: data }) })}\n\n`;
}

export async function POST(req: NextRequest) {
  const { promptIds } = await req.json().catch(() => ({ promptIds: null }));
  const prompts = promptIds 
    ? EVAL_DATASET.filter(p => promptIds.includes(p.id))
    : EVAL_DATASET;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(type, data)));
      };

      const results: PromptResult[] = [];
      send("eval_start", { total: prompts.length });

      for (let i = 0; i < prompts.length; i++) {
        const evalPrompt = prompts[i];
        send("prompt_start", { index: i, id: evalPrompt.id, label: evalPrompt.label });
        
        const startTime = Date.now();
        const stageTimings: Record<string, number> = {};
        
        try {
          const s1 = Date.now();
          const intent = await runStage1(evalPrompt.prompt);
          stageTimings.stage1 = Date.now() - s1;
          
          const s2 = Date.now();
          const architecture = await runStage2(intent);
          stageTimings.stage2 = Date.now() - s2;
          
          const s3 = Date.now();
          const schemas = await runStage3(intent, architecture);
          stageTimings.stage3 = Date.now() - s3;
          
          const s4 = Date.now();
          const { schemas: validatedSchemas, validation } = await runStage4(schemas);
          stageTimings.stage4 = Date.now() - s4;
          
          const s5 = Date.now();
          const assembled = await runStage5(intent, architecture, validatedSchemas, validation, stageTimings);
          stageTimings.stage5 = Date.now() - s5;
          
          const result = {
            id: evalPrompt.id,
            label: evalPrompt.label,
            category: evalPrompt.category,
            success: true,
            totalTimeMs: Date.now() - startTime,
            retriesUsed: 0,
            consistencyScore: validation.consistencyScore,
            executabilityScore: assembled.executabilityScore,
            stageTimings,
            compiledConfig: assembled,
          };
          
          results.push(result);
          send("prompt_complete", { index: i, result });
          
        } catch (error) {
          const result: PromptResult = {
            id: evalPrompt.id,
            label: evalPrompt.label,
            category: evalPrompt.category,
            success: false,
            totalTimeMs: Date.now() - startTime,
            retriesUsed: 0,
            consistencyScore: 0,
            executabilityScore: 0,
            failureType: error instanceof Error ? error.constructor.name : "UnknownError",
            error: error instanceof Error ? error.message : String(error),
            stageTimings,
          };
          
          results.push(result);
          send("prompt_failed", { index: i, result });
        }
        
        // Small delay between prompts to avoid rate limiting
        if (i < prompts.length - 1) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      
      send("eval_complete", { results });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
