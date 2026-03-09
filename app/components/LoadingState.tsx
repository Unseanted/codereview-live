"use client";

import { motion } from "framer-motion";
import { Loader2, GitPullRequest, Brain, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: GitPullRequest, label: "Fetching code…" },
  { icon: Brain, label: "Analyzing with AI…" },
  { icon: CheckCircle2, label: "Generating review…" },
];

export function LoadingState({ type }: { type: "github_pr" | "raw_code" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-8 py-16"
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 opacity-20 absolute inset-0 animate-ping" />
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center relative">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          Reviewing your code
        </h3>
        <p className="text-gray-400 text-sm">
          {type === "github_pr"
            ? "Fetching PR changes from GitHub and running AI analysis…"
            : "Running AI analysis on your code…"}
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {steps.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.6, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.6 + 0.2 }}
              className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0"
            >
              <step.icon className="w-4 h-4 text-purple-400" />
            </motion.div>
            <span className="text-gray-300 text-sm">{step.label}</span>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: i * 0.6 + 0.3, duration: 0.8 }}
              className="h-px bg-gradient-to-r from-purple-600 to-transparent flex-1"
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
