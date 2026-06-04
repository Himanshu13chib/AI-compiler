# AppCompiler — Natural Language → Full App Configuration

> A compiler for software generation. Not a chatbot wrapper. A multi-stage AI pipeline that transforms natural language into validated, executable application schemas — with the reliability of a compiler.

## What It Does

You type: `"Build a CRM with login, contacts, dashboard, role-based access, and premium payments."`

AppCompiler outputs a complete, cross-validated application config covering UI schema, API schema, database schema, auth schema, flow simulation results, risk analysis, cost estimates, and competitor DNA comparison.

## Architecture — Why Multi-Stage?

Single-prompt systems hallucinate and produce inconsistent output. A CRM generated in one shot might have a UI component referencing an API endpoint that does not exist, or a DB foreign key pointing to a non-existent table. We solve this the same way a real compiler does: separate passes, each with a specific responsibility, each validated before the next begins.

```
User Prompt
│
▼
[Stage 1] Intent Extractor
  Raw input → structured intent JSON
  Detects: features, roles, ambiguities, complexity score
  Zod-validated. Auto-coerces on schema mismatch.
│
▼
[Stage 2] System Architect
  Intent → full system design
  Entities, flows, role-permission matrix, cross-cutting concerns
  (caching, rate limits, audit logs)
│
▼
[Stage 3] Schema Generator
  One AI call → 4 schemas simultaneously:
  UI Schema, API Schema, DB Schema, Auth Schema
  Every field typed. Every relation explicit.
│
▼
[Stage 4] Validation + Repair Engine   ← most critical stage
  8 cross-layer consistency checks run automatically.
  Warnings: auto-fixed programmatically.
  Critical issues: surgical AI repair of ONLY the broken layer.
  Max 3 attempts per issue. Unresolved issues flagged clearly.
│
▼
[Stage 5] Assembler + Simulator
  Walks every user flow step against the schemas.
  Verifies: API endpoint exists, DB operation valid, role has permission.
  Produces executability score 0–100.
```

## The 8 Consistency Checks (Stage 4)

1. Every UI component `dataSource` maps to a real API endpoint
2. Every API field exists in DB schema
3. Every role in UI/API is defined in Auth schema
4. Every foreign key references a real table and column
5. Premium-gated features have access control in UI
6. No circular entity dependencies
7. Every flow actor is a defined role
8. Mandatory fields (`id`, `createdAt`, `updatedAt`) exist on all DB tables

## Key Design Decisions and Tradeoffs

**Why Gemini 2.0 Flash?**
Fast, free tier, strong at structured JSON. We use `responseMimeType: "application/json"` to constrain output at the model level — not just prompt engineering. This reduces hallucinated fields significantly.

**Why Zod on every stage output?**
Gemini occasionally returns valid JSON that does not match the expected schema. Without Zod, a wrong field type in Stage 2 silently corrupts Stage 3 and Stage 4. Zod catches this at the boundary. Each stage has a coerce fallback that fixes common issues (wrong enum value, number-as-string, missing array) before throwing.

**Why surgical repair instead of full retry?**
Full retry means 5 more API calls, 30+ more seconds, and often produces the same error because the model makes the same assumption. Surgical repair sends only the broken layer (e.g., just `dbSchema`) with the specific issue description. Faster, cheaper, more targeted.

**Why SSE streaming?**
The full pipeline takes 30–90 seconds. Without streaming, the user sees a blank screen and loses confidence. SSE pushes stage-by-stage progress so the UI always reflects what is happening.

**Cost vs Quality Tradeoff**
- `gemini-2.0-flash`: ~15s per stage, lower cost, good quality — default
- `gemini-2.5-flash`: ~25s per stage, higher quality, still free tier
- Automatic fallback on rate limit, then recovery when quota resets
- `maxOutputTokens: 8192` per stage — enough for complex apps, prevents runaway responses

## Running Locally

```bash
git clone https://github.com/Himanshu13chib/AI-compiler
cd AI-compiler
npm install
cp .env.example .env.local
# Add your Gemini API key from https://aistudio.google.com/ (free)
npm run dev
```

Open http://localhost:3000

## Evaluation Framework

Go to `/evaluate` to run the built-in benchmark:

- 10 real product prompts (CRM, e-commerce, healthcare, HR, delivery, etc.)
- 10 edge cases (vague inputs, contradictions, underspecified, conflicting roles)
- Tracks: success rate, retries per request, failure type breakdown, latency per stage

## Creative Features

| Feature | What It Does |
|---|---|
| App DNA | Radial SVG fingerprint across 8 complexity dimensions |
| Diff Engine | Git-style schema diff when re-generating with modified prompt |
| ELI5 Mode | Converts all technical output to plain English |
| Risk Analyzer | Skeptical senior engineer review — finds bottlenecks and gaps |
| Cost Estimator | Monthly infra cost at 1K / 10K / 100K users |
| Competitor DNA | Feature overlap vs Salesforce, Linear, Shopify, etc. |
| Refinement Chat | Surgical schema updates without full re-generation |
| Mobile Schema | Adapts UI schema for mobile (bottom nav, card layouts, swipe) |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | From https://aistudio.google.com/ — free |
| `GEMINI_MODEL` | No | Override model. Default: `gemini-2.0-flash` |

## Project Structure

```
app/
  page.tsx                   Main compiler interface
  evaluate/page.tsx          Benchmark dashboard
  api/generate/route.ts      SSE streaming pipeline endpoint
  api/validate/route.ts      Standalone validation
  api/evaluate/route.ts      Benchmark runner
  api/analyze-risks/         Risk analyzer
  api/competitor-dna/        Competitor comparison
  api/explain/               ELI5 mode
  api/refine/                Incremental refinement
  api/export-openapi/        OpenAPI YAML export

lib/pipeline/
  stage1-intent.ts           Intent extraction
  stage2-architect.ts        System design
  stage3-schema.ts           4-schema generation
  stage4-validate.ts         Validation + repair engine
  stage5-assemble.ts         Assembly + simulation
  schemas/index.ts           All Zod schemas

lib/utils/
  gemini.ts                  Gemini client with fallback chain
  consistency.ts             8 cross-layer consistency checks
  repair.ts                  Surgical repair engine
  simulator.ts               Flow execution simulator

components/
  pipeline/                  PipelineVisualizer, StageNode, LiveLog
  output/                    ApiSchemaTab, DatabaseTab, AuthMatrixTab, SimulationTab
  creative/                  AppDNA, DiffEngine, RiskAnalyzer, CostEstimator
  views/                     Page-level views
```
