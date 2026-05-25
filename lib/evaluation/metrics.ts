export interface PromptResult {
  id: string;
  label: string;
  category: "real" | "edge";
  success: boolean;
  totalTimeMs: number;
  retriesUsed: number;
  consistencyScore: number;
  executabilityScore: number;
  failureType?: string;
  error?: string;
  stageTimings?: Record<string, number>;
}

export interface AggregateMetrics {
  successRate: number;
  avgLatency: number;
  avgRetries: number;
  avgConsistencyScore: number;
  avgExecutabilityScore: number;
  failureBreakdown: Record<string, number>;
  realPromptSuccessRate: number;
  edgeCaseSuccessRate: number;
  fastestRun: number;
  slowestRun: number;
}

export function calculateAggregateMetrics(results: PromptResult[]): AggregateMetrics {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const realPrompts = results.filter(r => r.category === "real");
  const edgeCases = results.filter(r => r.category === "edge");
  
  const failureBreakdown: Record<string, number> = {};
  for (const r of failed) {
    const type = r.failureType || "unknown";
    failureBreakdown[type] = (failureBreakdown[type] || 0) + 1;
  }
  
  const latencies = results.map(r => r.totalTimeMs).filter(t => t > 0);
  
  return {
    successRate: results.length > 0 ? (successful.length / results.length) * 100 : 0,
    avgLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
    avgRetries: results.length > 0 ? results.reduce((a, r) => a + r.retriesUsed, 0) / results.length : 0,
    avgConsistencyScore: successful.length > 0 
      ? successful.reduce((a, r) => a + r.consistencyScore, 0) / successful.length 
      : 0,
    avgExecutabilityScore: successful.length > 0
      ? successful.reduce((a, r) => a + r.executabilityScore, 0) / successful.length
      : 0,
    failureBreakdown,
    realPromptSuccessRate: realPrompts.length > 0
      ? (realPrompts.filter(r => r.success).length / realPrompts.length) * 100
      : 0,
    edgeCaseSuccessRate: edgeCases.length > 0
      ? (edgeCases.filter(r => r.success).length / edgeCases.length) * 100
      : 0,
    fastestRun: latencies.length > 0 ? Math.min(...latencies) : 0,
    slowestRun: latencies.length > 0 ? Math.max(...latencies) : 0,
  };
}
