import { runConsistencyChecks, calculateConsistencyScore } from "@/lib/utils/consistency";
import { repairLayer, autoFixWarnings } from "@/lib/utils/repair";
import type { Stage3Output, Stage4Output, Issue } from "@/lib/pipeline/schemas";

export async function runStage4(
  schemas: Stage3Output,
  onProgress?: (msg: string) => void
): Promise<{ schemas: Stage3Output; validation: Stage4Output }> {
  const log = (msg: string) => onProgress?.(msg);
  
  log("Running cross-layer consistency checks...");
  let allIssues = runConsistencyChecks(schemas);
  
  const criticalIssues = allIssues.filter(i => i.type === "critical");
  const warnings = allIssues.filter(i => i.type === "warning");
  const suggestions = allIssues.filter(i => i.type === "suggestion");
  
  log(`Found ${criticalIssues.length} critical, ${warnings.length} warnings, ${suggestions.length} suggestions`);
  
  // Auto-fix warnings programmatically
  log("Auto-fixing warnings...");
  const { schemas: autoFixedSchemas, autoFixed } = autoFixWarnings(schemas, warnings);
  let currentSchemas = autoFixedSchemas;
  
  // AI repair for critical issues
  const aiRepaired: Stage4Output["aiRepaired"] = [];
  const unresolvedIssues: Issue[] = [];
  
  for (const issue of criticalIssues) {
    log(`Repairing critical issue: ${issue.description.substring(0, 60)}...`);
    
    const { schemas: repairedSchemas, result } = await repairLayer(issue, currentSchemas, 3);
    aiRepaired.push(result);
    
    if (result.success) {
      currentSchemas = repairedSchemas;
      log(`✓ Repaired: ${issue.description.substring(0, 50)}`);
    } else {
      unresolvedIssues.push(issue);
      log(`✗ Could not repair: ${issue.description.substring(0, 50)}`);
    }
  }
  
  // Re-run checks after repairs
  log("Re-running consistency checks after repairs...");
  const remainingIssues = runConsistencyChecks(currentSchemas);
  const finalCritical = remainingIssues.filter(i => i.type === "critical");
  const finalWarnings = remainingIssues.filter(i => i.type === "warning");
  const finalSuggestions = remainingIssues.filter(i => i.type === "suggestion");
  
  const consistencyScore = calculateConsistencyScore(remainingIssues);
  const totalIssues = remainingIssues.length + autoFixed.length;
  
  log(`Validation complete. Consistency score: ${consistencyScore}/100`);
  
  const validation: Stage4Output = {
    passed: finalCritical.length === 0,
    totalIssues,
    criticalIssues: finalCritical,
    warnings: finalWarnings,
    suggestions: finalSuggestions,
    autoFixed,
    aiRepaired,
    unresolvedIssues,
    consistencyScore,
  };
  
  return { schemas: currentSchemas, validation };
}
