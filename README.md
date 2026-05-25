# AppCompiler — Human Intent → Executable App Configuration

> A production-grade, 5-stage AI pipeline that converts natural language app descriptions into complete, validated, executable application configurations.

## What Is This?

AppCompiler is not a chatbot wrapper. It's an **engineered pipeline system** — think of it as a compiler for software, but instead of `code → machine instructions`, it's `human intent → complete, validated, executable app configuration`.

Every stage is a separate AI call with strict Zod validation, surgical repair on failures, and a simulation engine that proves the output actually works.

---

## Architecture

### The 5-Stage Pipeline

```
User Input
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Stage 1: Intent Extractor                                       │
│  • Identifies app type (20+ categories)                          │
│  • Extracts all features (explicit + implied)                    │
│  • Assigns complexity score 1-10                                 │
│  • Detects ambiguities, generates clarifying questions           │
│  • Infers missing but obvious features                           │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Stage 2: System Architect                                       │
│  • Designs entities with full field definitions                  │
│  • Defines all user flows (happy path + error states)            │
│  • Creates role-permission matrix                                │
│  • Identifies cross-cutting concerns (caching, rate limiting)    │
│  • Suggests microservice boundaries if complexity > 7            │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Stage 3: Schema Generator (4 schemas in 1 call)                 │
│  • UI Schema: pages, components, routes, SEO                     │
│  • API Schema: endpoints, methods, request/response, rate limits │
│  • DB Schema: PostgreSQL tables, columns, indexes, migrations    │
│  • Auth Schema: JWT/OAuth, roles, rules, premium gating          │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Stage 4: Validation + Repair Engine                             │
│  • Cross-layer consistency checks (8 check types)                │
│  • Auto-fix warnings programmatically                            │
│  • AI surgical repair for critical issues (max 3 attempts each)  │
│  • Calculates consistency score 0-100                            │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Stage 5: Final Assembler + Simulator                            │
│  • Assembles master config from all stages                       │
│  • Generates README documentation                                │
│  • Simulates every user flow against the schemas                 │
│  • Calculates executability score 0-100                          │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
Complete, Validated, Executable App Configuration
```

### Key Design Decisions

**Why separate AI calls per stage?**
Each stage has a different cognitive task. Mixing them degrades quality. Stage 1 needs product thinking; Stage 2 needs architectural thinking; Stage 3 needs schema design thinking. Separation also allows surgical repair — if Stage 3's DB schema breaks, we only re-call Stage 3, not the entire pipeline.

**Why Zod everywhere?**
AI output is non-deterministic. Without strict schema validation, downstream stages receive garbage. Zod catches type mismatches, missing fields, and invalid enums before they propagate.

**Why SSE streaming?**
The pipeline takes 30-120 seconds. SSE lets the UI show live progress per stage, live logs, and repair events — making the wait feel productive rather than frozen.

**Why surgical repair vs full retry?**
Full retry wastes tokens and time. If only the DB schema has a broken foreign key, we pass only the DB schema + the specific issue to Gemini. This is 10x cheaper and faster.

---

## Features

### Core Pipeline
- 5-stage AI pipeline with separate Gemini calls per stage
- Strict Zod validation on all outputs (no `.any()` anywhere)
- Surgical repair engine with max 3 attempts per issue
- Cross-layer consistency checks (8 check types)
- Flow simulation engine that walks every user flow

### Output Schemas
- **UI Schema**: Pages, routes, components, SEO meta, design tokens
- **API Schema**: REST endpoints with methods, roles, rate limits, webhooks
- **DB Schema**: PostgreSQL tables, columns, indexes, migrations, seed data
- **Auth Schema**: JWT/OAuth, role hierarchy, resource-action rules, premium gating

### Creative Features
- **App DNA Fingerprint**: Unique SVG radar chart across 8 complexity dimensions
- **Risk Analyzer**: Senior engineer code review — scalability, security, missing pieces
- **Cost Estimator**: Monthly AWS infrastructure costs at 1k/10k/100k users
- **Diff Engine**: Git-style diff between two generated configs
- **Evaluation Dashboard**: Run all 20 benchmark prompts with metrics and charts

### UI/UX
- Dark IDE/terminal aesthetic
- Animated pipeline visualizer with live logs
- Typewriter hero with cycling example prompts
- 10-tab output dashboard with Monaco editor
- Export to JSON, SQL, copy to clipboard

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| AI | Google Gemini 2.0 Flash |
| Validation | Zod (strict, no `.any()`) |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |

---

## Setup

### Prerequisites
- Node.js 18+
- A Gemini API key from [aistudio.google.com](https://aistudio.google.com) (free tier)

### Installation

```bash
git clone <repo>
cd appcompiler
npm install
```

### Environment Variables

Create `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Run Evaluation Benchmark

Navigate to [http://localhost:3000/evaluate](http://localhost:3000/evaluate) and click "Run Benchmark" to run all 20 test prompts.

---

## Project Structure

```
/app
  page.tsx                    # Main compiler interface
  /evaluate/page.tsx          # Evaluation dashboard
  /api/generate/route.ts      # SSE streaming pipeline endpoint
  /api/validate/route.ts      # Standalone validation
  /api/evaluate/route.ts      # Benchmark runner

/lib
  /pipeline
    stage1-intent.ts          # Intent extraction
    stage2-architect.ts       # System architecture design
    stage3-schema.ts          # 4-schema generation
    stage4-validate.ts        # Validation + repair orchestration
    stage5-assemble.ts        # Assembly + simulation
    /schemas/index.ts         # All Zod schemas

  /evaluation
    dataset.ts                # 20 benchmark prompts
    metrics.ts                # Aggregate metrics calculation

  /utils
    gemini.ts                 # Gemini client wrapper
    repair.ts                 # Surgical repair engine
    consistency.ts            # Cross-layer consistency checks
    simulator.ts              # Flow simulation engine

/components
  /pipeline
    PipelineVisualizer.tsx    # Animated pipeline diagram
    StageNode.tsx             # Individual stage node
    LiveLog.tsx               # Real-time log stream

  /output
    OverviewTab.tsx           # App summary + score gauges
    ApiSchemaTab.tsx          # Postman-style endpoint list
    DatabaseTab.tsx           # Table viewer + migrations
    AuthMatrixTab.tsx         # Role-permission matrix
    ValidationTab.tsx         # Issues + repair log
    SimulationTab.tsx         # Flow execution results

  /creative
    AppDNA.tsx                # Radar chart fingerprint
    RiskAnalyzer.tsx          # Risk analysis panel
    CostEstimator.tsx         # Infrastructure cost estimator
    DiffEngine.tsx            # Schema diff viewer
```

---

## Tradeoffs

1. **Latency vs Quality**: Each stage is a separate AI call, adding latency. The alternative (one mega-prompt) produces significantly worse output. We chose quality.

2. **Repair vs Retry**: Surgical repair is cheaper but more complex to implement. Full retry is simpler but wastes tokens. We chose surgical repair.

3. **Zod strictness vs Flexibility**: Strict Zod schemas catch AI hallucinations but require coercion logic for edge cases. We chose strictness with coercion fallbacks.

4. **Client-side simulation vs AI simulation**: The flow simulator runs client-side using heuristics rather than another AI call. This is faster and cheaper, though less nuanced.

---

## Evaluation Dataset

**10 Real Product Prompts**: CRM, E-commerce, Project Management, Healthcare, EdTech, Restaurant, Real Estate, HR, Multi-tenant SaaS, Delivery Platform

**10 Edge Cases**: Maximally vague, no domain, feature explosion, direct contradiction, logical conflict, single word clone, zero signal, role conflict, technical impossibility, overspecified chaos

---

*Built for the AI Engineer Internship Demo Task*
