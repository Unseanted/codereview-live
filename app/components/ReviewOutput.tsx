"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReviewResult } from "@/lib/llm";
import { CATEGORY_CONFIG, SEVERITY_ORDER, CategoryKey } from "@/lib/utils";
import { IssueCard } from "./IssueCard";
import { CheckCircle2, AlertTriangle, Star } from "lucide-react";

interface ReviewOutputProps {
  result: ReviewResult;
  prTitle?: string;
}

export function ReviewOutput({ result, prTitle }: ReviewOutputProps) {
  const [activeTab, setActiveTab] = useState<CategoryKey | "overview">(
    "overview"
  );

  const tabs: Array<CategoryKey | "overview"> = [
    "overview",
    "bugs",
    "performance",
    "style",
    "security",
  ];

  const getCategoryCount = (key: CategoryKey) =>
    result.categories[key]?.length || 0;

  const totalIssues = result.totalIssues;

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    if (score >= 4) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 8) return "from-green-600 to-emerald-500";
    if (score >= 6) return "from-yellow-600 to-amber-500";
    if (score >= 4) return "from-orange-600 to-amber-500";
    return "from-red-600 to-rose-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Code Review Report</h2>
          {prTitle && (
            <p className="text-gray-400 text-sm mt-0.5 truncate max-w-lg">
              {prTitle}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <div
            className={`text-3xl font-bold ${getScoreColor(result.overallScore)}`}
          >
            {result.overallScore}
            <span className="text-lg text-gray-500">/10</span>
          </div>
          <p className="text-xs text-gray-500">Overall Score</p>
        </div>
      </div>

      {/* Score Bar */}
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${result.overallScore * 10}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(result.overallScore)}`}
        />
      </div>

      {/* Summary Card */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          {totalIssues === 0 ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
          )}
          <span className="text-sm font-semibold text-gray-300">Summary</span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
            <Star className="w-3 h-3" />
            {totalIssues} issue{totalIssues !== 1 ? "s" : ""} found
          </span>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">{result.summary}</p>
      </div>

      {/* Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["bugs", "performance", "style", "security"] as CategoryKey[]).map(
          (cat) => {
            const count = getCategoryCount(cat);
            const cfg = CATEGORY_CONFIG[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`rounded-xl border p-3 text-center transition-all hover:border-purple-500/50 cursor-pointer ${
                  activeTab === cat
                    ? "border-purple-500/70 bg-purple-500/10"
                    : "border-gray-800 bg-gray-900/40"
                }`}
              >
                <div className="text-xl mb-1">{cfg.icon}</div>
                <div className="text-2xl font-bold text-white">{count}</div>
                <div className="text-xs text-gray-400">{cfg.label}</div>
              </button>
            );
          }
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="flex gap-1 overflow-x-auto pb-px scrollbar-hide">
          {tabs.map((tab) => {
            const isCategory = tab !== "overview";
            const count = isCategory ? getCategoryCount(tab as CategoryKey) : null;
            const cfg = isCategory ? CATEGORY_CONFIG[tab as CategoryKey] : null;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                {cfg && <span>{cfg.icon}</span>}
                <span className="capitalize">{tab}</span>
                {count !== null && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      count > 0
                        ? "bg-purple-500/30 text-purple-300"
                        : "bg-gray-800 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "overview" ? (
            <div className="space-y-6">
              {(["bugs", "performance", "style", "security"] as CategoryKey[]).map(
                (cat) => {
                  const items = result.categories[cat] || [];
                  const cfg = CATEGORY_CONFIG[cat];
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        {cfg.icon} {cfg.label}
                        <span className="text-xs text-gray-500 font-normal">
                          {items.length} issue{items.length !== 1 ? "s" : ""}
                        </span>
                      </h3>
                      <div className="space-y-2">
                        {items
                          .slice()
                          .sort(
                            (a, b) =>
                              SEVERITY_ORDER[a.severity] -
                              SEVERITY_ORDER[b.severity]
                          )
                          .slice(0, 3)
                          .map((item, i) => (
                            <IssueCard key={i} item={item} index={i} />
                          ))}
                        {items.length > 3 && (
                          <button
                            onClick={() => setActiveTab(cat)}
                            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            View {items.length - 3} more →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
              {totalIssues === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-white font-semibold">Excellent code!</p>
                  <p className="text-gray-400 text-sm">
                    No issues found across all categories.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <CategoryView
              items={result.categories[activeTab as CategoryKey] || []}
              category={activeTab as CategoryKey}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function CategoryView({
  items,
  category,
}: {
  items: ReviewResult["categories"]["bugs"];
  category: CategoryKey;
}) {
  const cfg = CATEGORY_CONFIG[category];
  const sorted = [...items].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  if (items.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-gray-800 bg-gray-900/40">
        <span className="text-4xl mb-3 block">{cfg.icon}</span>
        <p className="text-white font-semibold">{cfg.emptyMessage}</p>
        <p className="text-gray-500 text-sm mt-1">{cfg.description}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((item, i) => (
        <IssueCard key={i} item={item} index={i} />
      ))}
    </div>
  );
}
