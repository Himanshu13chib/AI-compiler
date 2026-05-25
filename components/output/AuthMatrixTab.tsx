"use client";

import { motion } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { Shield, Check, X, Lock, Key } from "lucide-react";

interface AuthMatrixTabProps {
  result: Stage5Output;
}

export function AuthMatrixTab({ result }: AuthMatrixTabProps) {
  const { authSchema } = result.masterConfig.schemas;
  const { rolePermissionMatrix } = result.masterConfig.architecture;

  const allEntities = Array.from(new Set(
    rolePermissionMatrix.flatMap(r => r.permissions.map(p => p.entity))
  ));
  const allActions = ["create", "read", "update", "delete", "export"] as const;

  function hasPermission(role: string, entity: string, action: string): boolean {
    const rolePerms = rolePermissionMatrix.find(r => r.role === role);
    if (!rolePerms) return false;
    const entityPerms = rolePerms.permissions.find(p => p.entity === entity);
    if (!entityPerms) return false;
    return entityPerms.actions.includes(action as "create" | "read" | "update" | "delete" | "export");
  }

  const CONDITION_COLORS: Record<string, string> = {
    public: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    role_based: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    owner_only: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    admin_only: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  return (
    <div className="space-y-6">
      {/* Auth config */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-zinc-300">Token Config</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Provider</span>
              <span className="text-indigo-300 font-medium">{authSchema.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Access Token</span>
              <span className="text-emerald-300">{authSchema.tokenConfig.accessExpiry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Refresh Token</span>
              <span className="text-emerald-300">{authSchema.tokenConfig.refreshExpiry}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {authSchema.strategies.map(s => (
                <span key={s} className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[10px]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-zinc-300">Roles ({authSchema.roles.length})</span>
          </div>
          <div className="space-y-2">
            {authSchema.roles.map(role => (
              <div key={role.name} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-zinc-200">{role.name}</div>
                  {role.inheritsFrom && (
                    <div className="text-[10px] text-zinc-500">inherits: {role.inheritsFrom}</div>
                  )}
                  <div className="text-[10px] text-zinc-500">{role.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {authSchema.premiumGating && authSchema.premiumGating.length > 0 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-zinc-300">Premium Gating</span>
            </div>
            <div className="space-y-2">
              {authSchema.premiumGating.map((gate, i) => (
                <div key={i} className="bg-amber-950/30 border border-amber-900/30 rounded-lg p-2">
                  <div className="text-[10px] text-amber-400 font-medium mb-1">{gate.planRequired}</div>
                  <div className="flex flex-wrap gap-1">
                    {gate.features.map(f => (
                      <span key={f} className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-300 rounded">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Permission matrix */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Role-Permission Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 text-zinc-500 font-medium bg-zinc-900/50 border border-zinc-800 rounded-tl-lg">
                  Entity / Role
                </th>
                {rolePermissionMatrix.map(r => (
                  <th key={r.role} className="px-3 py-2 text-zinc-300 font-medium bg-zinc-900/50 border border-zinc-800 text-center min-w-[80px]">
                    {r.role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allEntities.map((entity, ei) => (
                allActions.map((action, ai) => (
                  <motion.tr
                    key={`${entity}-${action}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (ei * allActions.length + ai) * 0.01 }}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20"
                  >
                    <td className="px-3 py-1.5 border border-zinc-800/50">
                      {ai === 0 ? (
                        <div>
                          <div className="font-medium text-zinc-200">{entity}</div>
                          <div className="text-[10px] text-zinc-600 capitalize">{action}</div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-zinc-600 capitalize pl-2">{action}</div>
                      )}
                    </td>
                    {rolePermissionMatrix.map(r => {
                      const has = hasPermission(r.role, entity, action);
                      return (
                        <td key={r.role} className="px-3 py-1.5 border border-zinc-800/50 text-center">
                          {has ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-zinc-700 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auth rules */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Access Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {authSchema.rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2">
              <code className="text-xs text-zinc-300 font-mono">{rule.resource}</code>
              <span className="text-zinc-600">→</span>
              <code className="text-xs text-zinc-400 font-mono">{rule.action}</code>
              <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full border ${CONDITION_COLORS[rule.condition] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                {rule.condition.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
