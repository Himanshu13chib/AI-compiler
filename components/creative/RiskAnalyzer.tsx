"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { AlertTriangle, Shield, Zap, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

interface RiskAnalyzerProps {
  result: Stage5Output;
}

interface RiskItem {
  category: "scalability" | "security" | "missing" | "over-engineered" | "under-engineered";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  recommendation: string;
}

const CATEGORY_CONFIG = {
  scalability: { icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-950/30 border-amber-900/40" },
  security: { icon: Shield, color: "text-red-400", bg: "bg-red-950/30 border-red-900/40" },
  missing: { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-950/30 border-orange-900/40" },
  "over-engineered": { icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-950/30 border-purple-900/40" },
  "under-engineered": { icon: TrendingDown, color: "text-blue-400", bg: "bg-blue-950/30 border-blue-900/40" },
};

const SEVERITY_BADGE = {
  high: "bg-red-500/20 text-red-300 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  low: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

export function RiskAnalyzer({ result }: RiskAnalyzerProps) {
  const [risks, setRisks] = useState<RiskItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyzeRisks() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/analyze-risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      
      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      setRisks(data.risks);
    } catch {
      // Generate client-side risks as fallback
      setRisks(generateLocalRisks(result));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <h3 className="text-sm font-semibold text-zinc-200">Risk Analyzer</h3>
          <span className="text-xs text-zinc-500">Senior engineer code review</span>
        </div>
        {!risks && (
          <button
            onClick={analyzeRisks}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-600/20 border border-amber-600/40 text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-600/30 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {loading ? "Analyzing..." : "Run Risk Analysis"}
          </button>
        )}
      </div>
      
      <AnimatePresence>
        {risks && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {risks.map((risk, i) => {
              const config = CATEGORY_CONFIG[risk.category];
              const Icon = config.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border rounded-xl p-4 ${config.bg}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-4 h-4 ${config.color} shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-zinc-200">{risk.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${SEVERITY_BADGE[risk.severity]}`}>
                          {risk.severity}
                        </span>
                        <span className={`text-[10px] ${config.color} capitalize`}>{risk.category}</span>
                      </div>
                      <p className="text-xs text-zinc-400">{risk.description}</p>
                      <div className="mt-2 flex items-start gap-1.5">
                        <span className="text-[10px] text-zinc-600 shrink-0 mt-0.5">→</span>
                        <p className="text-[10px] text-zinc-500">{risk.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      
      {!risks && !loading && (
        <div className="text-center py-8 text-zinc-600 text-sm">
          Click "Run Risk Analysis" to get a senior engineer's review of your architecture
        </div>
      )}
    </div>
  );
}

function generateLocalRisks(result: Stage5Output): RiskItem[] {
  const { intent, architecture, schemas } = result.masterConfig;
  const risks: RiskItem[] = [];
  
  if (intent.hasRealtime && schemas.dbSchema.tables.length > 10) {
    risks.push({
      category: "scalability",
      severity: "high",
      title: "Real-time at scale with large schema",
      description: `${schemas.dbSchema.tables.length} tables with real-time requirements will create significant WebSocket connection overhead.`,
      recommendation: "Consider using Redis pub/sub for real-time events and only push deltas, not full records.",
    });
  }
  
  if (intent.hasPayments && !schemas.authSchema.rules.some(r => r.condition === "admin_only")) {
    risks.push({
      category: "security",
      severity: "high",
      title: "Payment endpoints may lack admin-only protection",
      description: "Payment processing endpoints should have strict admin-only or owner-only access controls.",
      recommendation: "Add explicit admin_only rules for refund, payout, and billing management endpoints.",
    });
  }
  
  if (architecture.entities.length > 15) {
    risks.push({
      category: "over-engineered",
      severity: "medium",
      title: `Large entity count (${architecture.entities.length} entities)`,
      description: "Too many entities can lead to complex joins, slow queries, and difficult maintenance.",
      recommendation: "Consider consolidating related entities using JSONB columns for flexible attributes.",
    });
  }
  
  if (!intent.hasAnalytics && intent.complexityScore >= 7) {
    risks.push({
      category: "missing",
      severity: "medium",
      title: "No analytics for a complex application",
      description: "Complex apps without analytics make it impossible to understand user behavior and system health.",
      recommendation: "Add at minimum: error tracking (Sentry), usage analytics (Mixpanel/PostHog), and DB query monitoring.",
    });
  }
  
  if (schemas.apiSchema.endpoints.filter(e => !e.rateLimit).length > 5) {
    risks.push({
      category: "security",
      severity: "medium",
      title: "Many endpoints without rate limiting",
      description: `${schemas.apiSchema.endpoints.filter(e => !e.rateLimit).length} endpoints have no rate limit defined.`,
      recommendation: "Apply rate limiting to all public endpoints. Use Redis-based sliding window rate limiting.",
    });
  }
  
  if (intent.complexityScore <= 4 && architecture.entities.length > 8) {
    risks.push({
      category: "over-engineered",
      severity: "low",
      title: "Architecture complexity exceeds stated complexity score",
      description: "The generated architecture may be over-engineered for the stated use case.",
      recommendation: "Consider simplifying to a monolith with fewer entities and a simpler auth model.",
    });
  }
  
  return risks;
}
