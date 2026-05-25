"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { Key, Link, Hash, ChevronDown, ChevronRight } from "lucide-react";

interface DatabaseTabProps {
  result: Stage5Output;
}

const TYPE_COLORS: Record<string, string> = {
  uuid: "text-purple-400",
  varchar: "text-blue-400",
  text: "text-blue-300",
  integer: "text-amber-400",
  bigint: "text-amber-300",
  boolean: "text-emerald-400",
  timestamp: "text-cyan-400",
  timestamptz: "text-cyan-300",
  decimal: "text-orange-400",
  numeric: "text-orange-300",
  jsonb: "text-pink-400",
  json: "text-pink-300",
  bytea: "text-red-400",
};

function getTypeColor(type: string): string {
  const lower = type.toLowerCase();
  for (const [key, color] of Object.entries(TYPE_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "text-zinc-400";
}

export function DatabaseTab({ result }: DatabaseTabProps) {
  const { dbSchema } = result.masterConfig.schemas;
  const [expandedTable, setExpandedTable] = useState<string | null>(dbSchema.tables[0]?.name || null);
  const [activeTab, setActiveTab] = useState<"tables" | "migrations" | "seed">("tables");

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(["tables", "migrations", "seed"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab
                ? "bg-indigo-600 text-white"
                : "bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {tab === "tables" ? `Tables (${dbSchema.tables.length})` :
             tab === "migrations" ? `Migrations (${dbSchema.migrations?.length || 0})` :
             `Seed Data`}
          </button>
        ))}
        <div className="ml-auto text-xs text-zinc-500 flex items-center">
          <span className="text-zinc-400 font-medium">PostgreSQL</span>
        </div>
      </div>

      {activeTab === "tables" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Table list */}
          <div className="space-y-1">
            {dbSchema.tables.map(table => (
              <button
                key={table.name}
                onClick={() => setExpandedTable(table.name)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                  expandedTable === table.name
                    ? "bg-indigo-600/20 border border-indigo-600/40 text-indigo-300"
                    : "bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {expandedTable === table.name ? (
                  <ChevronDown className="w-3 h-3 shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 shrink-0" />
                )}
                <Hash className="w-3 h-3 shrink-0" />
                <span className="font-mono text-xs">{table.name}</span>
                <span className="ml-auto text-[10px] text-zinc-600">{table.columns.length} cols</span>
              </button>
            ))}
          </div>

          {/* Table detail */}
          <div className="md:col-span-2">
            {expandedTable && (() => {
              const table = dbSchema.tables.find(t => t.name === expandedTable);
              if (!table) return null;
              return (
                <motion.div
                  key={expandedTable}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden"
                >
                  <div className="bg-zinc-800/50 px-4 py-2 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-400" />
                    <span className="font-mono text-sm font-semibold text-zinc-200">{table.name}</span>
                    <span className="text-xs text-zinc-500 ml-2">{table.description}</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="text-left px-4 py-2 text-zinc-500 font-medium">Column</th>
                          <th className="text-left px-4 py-2 text-zinc-500 font-medium">Type</th>
                          <th className="text-left px-4 py-2 text-zinc-500 font-medium">Constraints</th>
                          <th className="text-left px-4 py-2 text-zinc-500 font-medium">Default</th>
                          <th className="text-left px-4 py-2 text-zinc-500 font-medium">FK</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.columns.map((col, i) => (
                          <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                            <td className="px-4 py-2 font-mono text-zinc-200 flex items-center gap-1.5">
                              {col.primaryKey && <Key className="w-3 h-3 text-amber-400 shrink-0" />}
                              {col.foreignKey && <Link className="w-3 h-3 text-blue-400 shrink-0" />}
                              {col.name}
                            </td>
                            <td className={`px-4 py-2 font-mono ${getTypeColor(col.type)}`}>{col.type}</td>
                            <td className="px-4 py-2">
                              <div className="flex flex-wrap gap-1">
                                {col.primaryKey && <span className="px-1 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[9px]">PK</span>}
                                {col.unique && <span className="px-1 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[9px]">UNIQUE</span>}
                                {!col.nullable && <span className="px-1 py-0.5 bg-red-500/10 text-red-400 rounded text-[9px]">NOT NULL</span>}
                              </div>
                            </td>
                            <td className="px-4 py-2 font-mono text-zinc-500 text-[10px]">{col.default || "—"}</td>
                            <td className="px-4 py-2 text-[10px]">
                              {col.foreignKey ? (
                                <span className="text-blue-400 font-mono">
                                  {col.foreignKey.table}.{col.foreignKey.column}
                                </span>
                              ) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {table.indexes && table.indexes.length > 0 && (
                    <div className="border-t border-zinc-800 p-3">
                      <div className="text-[10px] text-zinc-600 mb-1.5">Indexes</div>
                      <div className="flex flex-wrap gap-1.5">
                        {table.indexes.map((idx, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
                            {idx.unique ? "UNIQUE " : ""}{idx.name} ({idx.columns.join(", ")})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === "migrations" && (
        <div className="space-y-3">
          {(dbSchema.migrations || []).map((migration, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2 bg-zinc-800/30">
                <span className="text-xs font-mono text-indigo-400">#{migration.order.toString().padStart(3, "0")}</span>
                <span className="text-xs text-zinc-300">{migration.description}</span>
              </div>
              <pre className="p-4 text-xs font-mono text-zinc-400 overflow-x-auto bg-black/30">
                {migration.sql}
              </pre>
            </div>
          ))}
        </div>
      )}

      {activeTab === "seed" && (
        <div className="space-y-3">
          {(dbSchema.seedData || []).map((seed, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-zinc-800/30 text-xs font-mono text-emerald-400">
                {seed.table} ({seed.rows.length} rows)
              </div>
              <pre className="p-4 text-xs font-mono text-zinc-400 overflow-x-auto bg-black/30">
                {JSON.stringify(seed.rows, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
