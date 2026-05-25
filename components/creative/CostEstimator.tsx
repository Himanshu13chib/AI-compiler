"use client";

import { motion } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { DollarSign, Users, Server, Database, Globe } from "lucide-react";

interface CostEstimatorProps {
  result: Stage5Output;
}

interface CostBreakdown {
  component: string;
  icon: React.ReactNode;
  monthly1k: number;
  monthly10k: number;
  monthly100k: number;
  notes: string;
}

function estimateCosts(result: Stage5Output): CostBreakdown[] {
  const { intent, schemas } = result.masterConfig;
  const tableCount = schemas.dbSchema.tables.length;
  const endpointCount = schemas.apiSchema.endpoints.length;
  
  const breakdown: CostBreakdown[] = [];
  
  // Database
  const dbBase = tableCount * 2;
  breakdown.push({
    component: "Database (PostgreSQL)",
    icon: <Database className="w-4 h-4" />,
    monthly1k: Math.round(dbBase * 1.5),
    monthly10k: Math.round(dbBase * 4),
    monthly100k: Math.round(dbBase * 15),
    notes: `${tableCount} tables, estimated storage growth`,
  });
  
  // Compute
  const computeBase = endpointCount * 0.5;
  breakdown.push({
    component: "Compute (API Server)",
    icon: <Server className="w-4 h-4" />,
    monthly1k: Math.round(Math.max(10, computeBase * 2)),
    monthly10k: Math.round(Math.max(25, computeBase * 6)),
    monthly100k: Math.round(Math.max(80, computeBase * 20)),
    notes: `${endpointCount} endpoints, auto-scaling`,
  });
  
  // CDN / Storage
  if (intent.hasFileUpload) {
    breakdown.push({
      component: "File Storage (S3/CDN)",
      icon: <Globe className="w-4 h-4" />,
      monthly1k: 5,
      monthly10k: 25,
      monthly100k: 150,
      notes: "File uploads, CDN distribution",
    });
  }
  
  // Real-time
  if (intent.hasRealtime) {
    breakdown.push({
      component: "Real-time (WebSocket)",
      icon: <Globe className="w-4 h-4" />,
      monthly1k: 8,
      monthly10k: 45,
      monthly100k: 280,
      notes: "WebSocket connections, message broker",
    });
  }
  
  // Email/Notifications
  if (intent.hasNotifications) {
    breakdown.push({
      component: "Notifications (Email/Push)",
      icon: <Users className="w-4 h-4" />,
      monthly1k: 3,
      monthly10k: 18,
      monthly100k: 120,
      notes: "Email delivery, push notifications",
    });
  }
  
  // Payments
  if (intent.hasPayments) {
    breakdown.push({
      component: "Payment Processing (Stripe)",
      icon: <DollarSign className="w-4 h-4" />,
      monthly1k: 0,
      monthly10k: 0,
      monthly100k: 0,
      notes: "2.9% + $0.30 per transaction (variable)",
    });
  }
  
  return breakdown;
}

export function CostEstimator({ result }: CostEstimatorProps) {
  const breakdown = estimateCosts(result);
  
  const total1k = breakdown.reduce((s, b) => s + b.monthly1k, 0);
  const total10k = breakdown.reduce((s, b) => s + b.monthly10k, 0);
  const total100k = breakdown.reduce((s, b) => s + b.monthly100k, 0);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📊</span>
        <h3 className="text-sm font-semibold text-zinc-200">Infrastructure Cost Estimator</h3>
        <span className="text-xs text-zinc-500 ml-auto">AWS estimates</span>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { users: "1,000", total: total1k, color: "text-emerald-400", bg: "bg-emerald-950/30 border-emerald-900/40" },
          { users: "10,000", total: total10k, color: "text-amber-400", bg: "bg-amber-950/30 border-amber-900/40" },
          { users: "100,000", total: total100k, color: "text-red-400", bg: "bg-red-950/30 border-red-900/40" },
        ].map(({ users, total, color, bg }) => (
          <div key={users} className={`border rounded-xl p-4 text-center ${bg}`}>
            <div className={`text-2xl font-bold ${color}`}>${total}/mo</div>
            <div className="text-xs text-zinc-500 mt-1">{users} users</div>
          </div>
        ))}
      </div>
      
      {/* Breakdown table */}
      <div className="space-y-2">
        {breakdown.map((item, i) => (
          <motion.div
            key={item.component}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 bg-zinc-800/30 rounded-xl px-4 py-3"
          >
            <div className="text-zinc-500 shrink-0">{item.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-zinc-200">{item.component}</div>
              <div className="text-[10px] text-zinc-600">{item.notes}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs text-right shrink-0">
              <div>
                <div className="text-emerald-400 font-medium">${item.monthly1k}</div>
                <div className="text-zinc-600 text-[9px]">1k</div>
              </div>
              <div>
                <div className="text-amber-400 font-medium">${item.monthly10k}</div>
                <div className="text-zinc-600 text-[9px]">10k</div>
              </div>
              <div>
                <div className="text-red-400 font-medium">${item.monthly100k}</div>
                <div className="text-zinc-600 text-[9px]">100k</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <p className="text-[10px] text-zinc-600 mt-4">
        * Estimates based on AWS pricing. Actual costs vary by region, usage patterns, and reserved instance discounts. Payment processing costs are variable (2.9% + $0.30/transaction).
      </p>
    </div>
  );
}
