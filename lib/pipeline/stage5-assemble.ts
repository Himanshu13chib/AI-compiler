import { generateText } from "@/lib/utils/gemini";
import { simulateFlows } from "@/lib/utils/simulator";
import type { Stage1Output, Stage2Output, Stage3Output, Stage4Output, Stage5Output } from "@/lib/pipeline/schemas";

export async function runStage5(
  intent: Stage1Output,
  architecture: Stage2Output,
  schemas: Stage3Output,
  validation: Stage4Output,
  stageTimings: Record<string, number>,
  onProgress?: (msg: string) => void
): Promise<Stage5Output> {
  const log = (msg: string) => onProgress?.(msg);
  const startTime = Date.now();
  
  log("Generating README documentation...");
  const readme = await generateReadme(intent, architecture, schemas, validation);
  
  log("Running flow simulation...");
  const { results: simulationResults, executabilityScore } = simulateFlows(architecture, schemas);
  
  log(`Simulation complete. Executability score: ${executabilityScore}/100`);
  
  const totalTimeMs = Object.values(stageTimings).reduce((a, b) => a + b, 0);
  
  const output: Stage5Output = {
    masterConfig: {
      intent,
      architecture,
      schemas,
      validation,
    },
    readme,
    metadata: {
      generatedAt: new Date().toISOString(),
      pipelineVersion: "1.0.0",
      totalTokensUsed: estimateTokens(intent, architecture, schemas),
      totalTimeMs,
      stageTimings,
    },
    simulationResults,
    executabilityScore,
  };
  
  log("Assembly complete.");
  return output;
}

async function generateReadme(
  intent: Stage1Output,
  architecture: Stage2Output,
  schemas: Stage3Output,
  validation: Stage4Output
): Promise<string> {
  const prompt = `Generate a comprehensive README.md for this application:

App: ${intent.appName} (${intent.appType})
Tagline: ${intent.tagline}
Complexity: ${intent.complexityScore}/10
Features: ${intent.features.map(f => f.name).join(", ")}
Entities: ${architecture.entities.map(e => e.name).join(", ")}
Pages: ${schemas.uiSchema.pages.map(p => p.name).join(", ")}
API Endpoints: ${schemas.apiSchema.endpoints.length}
DB Tables: ${schemas.dbSchema.tables.length}
Auth: ${schemas.authSchema.provider}
Consistency Score: ${validation.consistencyScore}/100

Write a professional README with: Overview, Architecture, Features, Tech Stack, Database Schema summary, API summary, Auth model, Setup instructions, Environment variables.`;

  return generateText(prompt, "You are a technical writer. Generate clear, professional README documentation in Markdown format.");
}

function estimateTokens(
  intent: Stage1Output,
  architecture: Stage2Output,
  schemas: Stage3Output
): number {
  const text = JSON.stringify({ intent, architecture, schemas });
  return Math.round(text.length / 4); // rough estimate: 4 chars per token
}
