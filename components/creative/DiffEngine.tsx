"use client";

import { motion } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { Plus, Minus, Edit3 } from "lucide-react";

interface DiffEngineProps {
  previous: Stage5Output;
  current: Stage5Output;
}

interface DiffItem {
  type: "added" | "removed" | "changed";
  category: string;
  description: string;
}

function computeDiff(prev: Stage5Output, curr: Stage5Output): DiffItem[] {
  const diffs: DiffItem[] = [];
  
  const prevIntent = prev.masterConfig.intent;
  const currIntent = curr.masterConfig.intent;
  
  // Feature diffs
  const prevFeatures = new Set(prevIntent.features.map(f => f.name));
  const currFeatures = new Set(currIntent.features.map(f => f.name));
  
  for (const f of currFeatures) {
    if (!prevFeatures.has(f)) {
      diffs.push({ type: "added", category: "Feature", description: f });
    }
  }
  for (const f of prevFeatures) {
    if (!currFeatures.has(f)) {
      diffs.push({ type: "removed", category: "Feature", description: f });
    }
  }
  
  // Entity diffs
  const prevEntities = new Set(prev.masterConfig.architecture.entities.map(e => e.name));
  const currEntities = new Set(curr.masterConfig.architecture.entities.map(e => e.name));
  
  for (const e of currEntities) {
    if (!prevEntities.has(e)) {
      diffs.push({ type: "added", category: "Entity", description: e });
    }
  }
  for (const e of prevEntities) {
    if (!currEntities.has(e)) {
      diffs.push({ type: "removed", category: "Entity", description: e });
    }
  }
  
  // API endpoint diffs
  const prevEndpoints = new Set(prev.masterConfig.schemas.apiSchema.endpoints.map(e => `${e.method} ${e.path}`));
  const currEndpoints = new Set(curr.masterConfig.schemas.apiSchema.endpoints.map(e => `${e.method} ${e.path}`));
  
  for (const e of currEndpoints) {
    if (!prevEndpoints.has(e)) {
      diffs.push({ type: "added", category: "API Endpoint", description: e });
    }
  }
  for (const e of prevEndpoints) {
    if (!currEndpoints.has(e)) {
      diffs.push({ type: "removed", category: "API Endpoint", description: e });
    }
  }
  
  // Score changes
  if (prevIntent.complexityScore !== currIntent.complexityScore) {
    diffs.push({
      type: "changed",
      category: "Complexity Score",
      description: `${prevIntent.complexityScore} → ${currIntent.complexityScore}`,
    });
  }
  
  if (prev.masterConfig.validation.consistencyScore !== curr.masterConfig.validation.consistencyScore) {
    diffs.push({
      type: "changed",
      category: "Consistency Score",
      description: `${prev.masterConfig.validation.consistencyScore} → ${curr.masterConfig.validation.consistencyScore}`,
    });
  }
  
  return diffs;
}

const DIFF_CONFIG = {
  added: { icon: Plus, color: "text-emerald-400", bg: "bg-emerald-950/30 border-emerald-900/40", prefix: "+" },
  removed: { icon: Minus, color: "text-red-400", bg: "bg-red-950/30 border-red-900/40", prefix: "-" },
  changed: { icon: Edit3, color: "text-amber-400", bg: "bg-amber-950/30 border-amber-900/40", prefix: "~" },
};

export function DiffEngine({ previous, current }: DiffEngineProps) {
  const diffs = computeDiff(previous, current);
  
  const added = diffs.filter(d => d.type === "added");
  const removed = diffs.filter(d => d.type === "removed");
  const changed = diffs.filter(d => d.type === "changed");

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🧬</span>
        <h3 className="text-sm font-semibold text-zinc-200">Schema Diff</h3>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <span className="text-emerald-400">+{added.length} added</span>
          <span className="text-red-400">-{removed.length} removed</span>
          <span className="text-amber-400">~{changed.length} changed</span>
        </div>
      </div>
      
      {diffs.length === 0 ? (
        <div className="text-center py-6 text-zinc-600 text-sm">No changes detected between versions</div>
      ) : (
        <div className="space-y-1 font-mono text-xs">
          {diffs.map((diff, i) => {
            const config = DIFF_CONFIG[diff.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bg}`}
              >
                <span className={`font-bold ${config.color} w-4`}>{config.prefix}</span>
                <Icon className={`w-3 h-3 ${config.color} shrink-0`} />
                <span className="text-zinc-500">[{diff.category}]</span>
                <span className="text-zinc-300">{diff.description}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
