import fs from 'fs';
import path from 'path';

// Manual env loader
const envPath = "c:\\Users\\Asus\\Desktop\\internship\\appcompiler\\.env.local";
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  }
}

import { runStage1 } from "@/lib/pipeline/stage1-intent";
import { runStage2 } from "@/lib/pipeline/stage2-architect";
import { runStage3 } from "@/lib/pipeline/stage3-schema";
import { runStage4 } from "@/lib/pipeline/stage4-validate";
import { runStage5 } from "@/lib/pipeline/stage5-assemble";

async function main() {
  const prompt = "E-commerce platform with product catalog, cart, Stripe payments, order tracking, vendor dashboard, and admin panel";
  console.log("--- RUNNING STAGE 1 ---");
  const intent = await runStage1(prompt);
  console.log("✓ Stage 1 Complete:", intent.appName);

  console.log("--- RUNNING STAGE 2 ---");
  const architecture = await runStage2(intent);
  console.log("✓ Stage 2 Complete:", architecture.entities.length, "entities");

  console.log("--- RUNNING STAGE 3 ---");
  const schemas = await runStage3(intent, architecture);
  console.log("✓ Stage 3 Complete");

  console.log("--- RUNNING STAGE 4 ---");
  const { schemas: validatedSchemas, validation } = await runStage4(schemas, (msg) => console.log("Log:", msg));
  console.log("✓ Stage 4 Complete: Passed:", validation.passed, "Consistency Score:", validation.consistencyScore);

  console.log("--- RUNNING STAGE 5 ---");
  const assembled = await runStage5(intent, architecture, validatedSchemas, validation, {
    stage1: 1000,
    stage2: 1000,
    stage3: 1000,
    stage4: 1000,
  });
  console.log("✓ Stage 5 Complete: Executability Score:", assembled.executabilityScore);
}

main().catch(err => {
  console.error("PIPELINE CRASHED:", err);
  process.exit(1);
});
