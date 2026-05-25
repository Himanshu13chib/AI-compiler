"use client";

import { motion } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";

interface AppDNAProps {
  result: Stage5Output;
}

interface DNADimension {
  label: string;
  value: number;
  color: string;
}

function computeDNA(result: Stage5Output): DNADimension[] {
  const { intent, architecture, schemas } = result.masterConfig;
  
  const authComplexity = Math.min(100, 
    (schemas.authSchema.roles.length * 10) + 
    (schemas.authSchema.rules.length * 3) + 
    (intent.hasAuth ? 20 : 0)
  );
  
  const dataRelations = Math.min(100,
    architecture.entities.reduce((s, e) => s + e.relations.length * 15, 0)
  );
  
  const uiDepth = Math.min(100,
    (schemas.uiSchema.pages.length * 8) +
    schemas.uiSchema.pages.reduce((s, p) => s + p.components.length * 2, 0)
  );
  
  const apiSurface = Math.min(100, schemas.apiSchema.endpoints.length * 5);
  
  const businessLogic = Math.min(100,
    architecture.entities.reduce((s, e) => s + e.businessRules.length * 8, 0) +
    architecture.flows.length * 5
  );
  
  const realtimeNeeds = intent.hasRealtime ? 80 : 20;
  
  const securityReqs = Math.min(100,
    (intent.hasAuth ? 30 : 0) +
    (intent.hasPayments ? 30 : 0) +
    (schemas.authSchema.premiumGating?.length || 0) * 10 +
    schemas.authSchema.rules.filter(r => r.condition === "admin_only").length * 5
  );
  
  const scalabilityNeeds = Math.min(100, intent.complexityScore * 10);
  
  return [
    { label: "Auth Complexity", value: authComplexity, color: "#6366f1" },
    { label: "Data Relations", value: dataRelations, color: "#8b5cf6" },
    { label: "UI Depth", value: uiDepth, color: "#06b6d4" },
    { label: "API Surface", value: apiSurface, color: "#10b981" },
    { label: "Business Logic", value: businessLogic, color: "#f59e0b" },
    { label: "Realtime Needs", value: realtimeNeeds, color: "#ef4444" },
    { label: "Security Reqs", value: securityReqs, color: "#ec4899" },
    { label: "Scalability", value: scalabilityNeeds, color: "#14b8a6" },
  ];
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export function AppDNA({ result }: AppDNAProps) {
  const dimensions = computeDNA(result);
  const cx = 150, cy = 150, maxR = 110;
  const n = dimensions.length;
  const angleStep = 360 / n;

  // Build polygon path for the DNA shape
  const points = dimensions.map((dim, i) => {
    const r = (dim.value / 100) * maxR;
    return polarToCartesian(cx, cy, r, i * angleStep);
  });
  
  const polygonPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
  
  // Grid rings
  const gridRings = [20, 40, 60, 80, 100];

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🔮</span>
        <h3 className="text-sm font-semibold text-zinc-200">App DNA Fingerprint</h3>
        <span className="text-xs text-zinc-500 ml-auto">Unique to {result.masterConfig.intent.appName}</span>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Radar chart */}
        <div className="shrink-0">
          <svg width="300" height="300" viewBox="0 0 300 300">
            {/* Grid rings */}
            {gridRings.map(pct => {
              const r = (pct / 100) * maxR;
              const ringPoints = Array.from({ length: n }, (_, i) => {
                const p = polarToCartesian(cx, cy, r, i * angleStep);
                return `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
              }).join(" ") + " Z";
              return (
                <path key={pct} d={ringPoints} fill="none" stroke="#27272a" strokeWidth="1" />
              );
            })}
            
            {/* Axis lines */}
            {dimensions.map((_, i) => {
              const outer = polarToCartesian(cx, cy, maxR, i * angleStep);
              return (
                <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#3f3f46" strokeWidth="1" />
              );
            })}
            
            {/* DNA shape */}
            <motion.path
              d={polygonPath}
              fill="rgba(99,102,241,0.15)"
              stroke="#6366f1"
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
            
            {/* Data points */}
            {points.map((p, i) => (
              <motion.circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="4"
                fill={dimensions[i].color}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              />
            ))}
            
            {/* Labels */}
            {dimensions.map((dim, i) => {
              const labelR = maxR + 22;
              const p = polarToCartesian(cx, cy, labelR, i * angleStep);
              return (
                <text
                  key={i}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fill="#71717a"
                >
                  {dim.label}
                </text>
              );
            })}
          </svg>
        </div>
        
        {/* Dimension bars */}
        <div className="flex-1 space-y-3 w-full">
          {dimensions.map((dim, i) => (
            <motion.div
              key={dim.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="space-y-1"
            >
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">{dim.label}</span>
                <span className="font-medium" style={{ color: dim.color }}>{dim.value}</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: dim.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${dim.value}%` }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
