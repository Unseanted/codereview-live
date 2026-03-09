"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReviewItem } from "@/lib/llm";
import { SEVERITY_COLORS, SEVERITY_LABELS } from "@/lib/utils";

interface IssueCardProps {
  item: ReviewItem;
  index: number;
}

export function IssueCard({ item, index }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border ${colors.border} bg-gray-900/60 backdrop-blur-sm overflow-hidden`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-white/5 transition-colors"
      >
        {/* Severity dot */}
        <span
          className={`mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full ${colors.dot}`}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
              {SEVERITY_LABELS[item.severity]}
            </span>
            {item.file && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <FileCode className="w-3 h-3" />
                {item.file}
                {item.line && `:${item.line}`}
              </span>
            )}
          </div>
          <p className="font-medium text-white text-sm leading-snug">
            {item.title}
          </p>
        </div>

        <span className="flex-shrink-0 text-gray-500 mt-0.5">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Problem
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Suggestion
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {item.suggestion}
                </p>
              </div>

              {item.code && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Fix
                  </p>
                  <pre className="text-sm bg-gray-950 rounded-lg p-3 overflow-x-auto border border-gray-800">
                    <code className="text-green-400 font-mono">{item.code}</code>
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
