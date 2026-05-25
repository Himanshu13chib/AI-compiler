"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { Search, Lock, Zap, Database } from "lucide-react";

interface ApiSchemaTabProps {
  result: Stage5Output;
}

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  POST: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  PUT: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  PATCH: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  DELETE: "bg-red-500/20 text-red-300 border-red-500/40",
};

export function ApiSchemaTab({ result }: ApiSchemaTabProps) {
  const { apiSchema } = result.masterConfig.schemas;
  const [search, setSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = apiSchema.endpoints.filter(e => {
    const matchSearch = !search || 
      e.path.toLowerCase().includes(search.toLowerCase()) ||
      e.summary.toLowerCase().includes(search.toLowerCase());
    const matchMethod = !selectedMethod || e.method === selectedMethod;
    return matchSearch && matchMethod;
  });

  const methodCounts = apiSchema.endpoints.reduce((acc, e) => {
    acc[e.method] = (acc[e.method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(methodCounts).map(([method, count]) => (
          <button
            key={method}
            onClick={() => setSelectedMethod(selectedMethod === method ? null : method)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              selectedMethod === method
                ? METHOD_STYLES[method]
                : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <span className={`font-bold ${METHOD_STYLES[method]?.split(" ")[1]}`}>{method}</span>
            <span className="text-zinc-500">{count}</span>
          </button>
        ))}
        <div className="ml-auto text-xs text-zinc-500 flex items-center gap-1">
          <span className="font-bold text-white">{apiSchema.endpoints.length}</span> endpoints
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search endpoints..."
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-600"
        />
      </div>

      {/* Endpoint list */}
      <div className="space-y-2">
        {filtered.map((endpoint, i) => (
          <motion.div
            key={endpoint.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === endpoint.id ? null : endpoint.id)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-800/30 transition-colors"
            >
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border shrink-0 ${METHOD_STYLES[endpoint.method]}`}>
                {endpoint.method}
              </span>
              <code className="text-sm text-zinc-200 font-mono flex-1">{endpoint.path}</code>
              <span className="text-xs text-zinc-500 hidden md:block">{endpoint.summary}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {endpoint.requiredRoles.length > 0 && endpoint.requiredRoles[0] !== "public" && (
                  <Lock className="w-3 h-3 text-amber-500" />
                )}
                {endpoint.cacheable && <Zap className="w-3 h-3 text-blue-400" />}
                {endpoint.webhookTriggers && endpoint.webhookTriggers.length > 0 && (
                  <Database className="w-3 h-3 text-purple-400" />
                )}
              </div>
            </button>
            
            {expanded === endpoint.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="border-t border-zinc-800 p-4 space-y-3"
              >
                <p className="text-xs text-zinc-400">{endpoint.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-zinc-600 mb-1">Required Roles</div>
                    <div className="flex flex-wrap gap-1">
                      {endpoint.requiredRoles.map(r => (
                        <span key={r} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  {endpoint.rateLimit && (
                    <div>
                      <div className="text-zinc-600 mb-1">Rate Limit</div>
                      <span className="text-red-400">{endpoint.rateLimit}</span>
                    </div>
                  )}
                  <div>
                    <div className="text-zinc-600 mb-1">Cacheable</div>
                    <span className={endpoint.cacheable ? "text-emerald-400" : "text-zinc-500"}>
                      {endpoint.cacheable ? "Yes" : "No"}
                    </span>
                  </div>
                  {endpoint.webhookTriggers && endpoint.webhookTriggers.length > 0 && (
                    <div>
                      <div className="text-zinc-600 mb-1">Webhooks</div>
                      <div className="flex flex-wrap gap-1">
                        {endpoint.webhookTriggers.map(w => (
                          <span key={w} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px]">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {endpoint.requestBody && (
                  <div>
                    <div className="text-xs text-zinc-600 mb-1">Request Body</div>
                    <div className="bg-black/40 rounded-lg p-2 space-y-1">
                      {endpoint.requestBody.fields.map(f => (
                        <div key={f.name} className="flex items-center gap-2 text-xs">
                          <code className="text-blue-300">{f.name}</code>
                          <span className="text-zinc-600">:</span>
                          <span className="text-amber-300">{f.type}</span>
                          {f.required && <span className="text-red-400 text-[10px]">required</span>}
                          {f.validation && <span className="text-zinc-500 text-[10px]">({f.validation})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {endpoint.queryParams && endpoint.queryParams.length > 0 && (
                  <div>
                    <div className="text-xs text-zinc-600 mb-1">Query Params</div>
                    <div className="bg-black/40 rounded-lg p-2 space-y-1">
                      {endpoint.queryParams.map(p => (
                        <div key={p.name} className="flex items-center gap-2 text-xs">
                          <code className="text-emerald-300">{p.name}</code>
                          <span className="text-zinc-600">:</span>
                          <span className="text-amber-300">{p.type}</span>
                          {p.required && <span className="text-red-400 text-[10px]">required</span>}
                          <span className="text-zinc-500 text-[10px]">— {p.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
