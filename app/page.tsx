"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitPullRequest, Code2, ArrowRight, Sparkles, Github, Zap, Shield } from "lucide-react";
import dynamic from "next/dynamic";
import { ReviewOutput } from "./components/ReviewOutput";
import { LoadingState } from "./components/LoadingState";
import { ReviewResult } from "@/lib/llm";

const CodeMirrorEditor = dynamic(
  () => import("./components/CodeInput"),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 bg-gray-900 rounded-xl border border-gray-700 flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading editor…</span>
      </div>
    ),
  }
) as React.FC<{ value: string; onChange: (v: string) => void; language?: string }>;

type InputMode = "github_pr" | "raw_code";

const LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "Go", "Rust",
  "Java", "C++", "C#", "PHP", "Ruby", "Swift", "Kotlin",
  "SQL", "CSS", "HTML", "Shell",
];

const FEATURES = [
  { icon: "🐛", label: "Bug Detection", desc: "Critical and major logic errors" },
  { icon: "⚡", label: "Performance", desc: "Bottlenecks and optimization tips" },
  { icon: "🎨", label: "Code Style", desc: "Readability and best practices" },
  { icon: "🔒", label: "Security", desc: "Vulnerabilities and risk exposure" },
];

export default function Home() {
  const [mode, setMode] = useState<InputMode>("github_pr");
  const [prUrl, setPrUrl] = useState("");
  const [rawCode, setRawCode] = useState("");
  const [language, setLanguage] = useState("TypeScript");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const canSubmit =
    !loading &&
    (mode === "github_pr"
      ? prUrl.includes("github.com") && prUrl.includes("/pull/")
      : rawCode.trim().length >= 10);

  async function handleReview() {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const body =
        mode === "github_pr"
          ? { type: "github_pr", value: prUrl }
          : { type: "raw_code", value: rawCode, language };

      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Review failed");
      }

      setResult(data as ReviewResult);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Animated gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-700/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 pb-24">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              CodeReview.live
            </span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </header>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center pt-12 pb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium mb-6">
            <Sparkles className="w-3 h-3" />
            Powered by GPT-4o
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-4">
            AI Code Review
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              in Seconds
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Paste a GitHub PR URL or raw code and get instant, structured feedback
            across bugs, performance, style, and security.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {FEATURES.map((f) => (
              <span
                key={f.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-sm text-gray-300"
              >
                <span>{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-xl p-6 shadow-2xl"
        >
          {/* Mode Tabs */}
          <div className="flex rounded-xl bg-gray-950 border border-gray-800 p-1 mb-6 w-fit">
            <button
              id="tab-github-pr"
              onClick={() => { setMode("github_pr"); setError(null); setResult(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "github_pr"
                  ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <GitPullRequest className="w-4 h-4" />
              GitHub PR
            </button>
            <button
              id="tab-raw-code"
              onClick={() => { setMode("raw_code"); setError(null); setResult(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "raw_code"
                  ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Code2 className="w-4 h-4" />
              Paste Code
            </button>
          </div>

          {/* Input area */}
          <AnimatePresence mode="wait">
            {mode === "github_pr" ? (
              <motion.div
                key="github"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                <label
                  htmlFor="pr-url-input"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  GitHub Pull Request URL
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Github className="w-4 h-4 text-gray-500" />
                  </div>
                  <input
                    id="pr-url-input"
                    type="url"
                    value={prUrl}
                    onChange={(e) => setPrUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canSubmit && handleReview()}
                    placeholder="https://github.com/owner/repo/pull/123"
                    className="w-full bg-gray-950 border border-gray-700 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Works with public repos. Add GITHUB_TOKEN in .env.local for private repos or to avoid rate limits.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">
                    Paste your code
                  </label>
                  <select
                    id="language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="text-xs bg-gray-950 border border-gray-700 text-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <CodeMirrorEditor
                  value={rawCode}
                  onChange={setRawCode}
                  language={language}
                />
                <p className="text-xs text-gray-600">
                  {rawCode.length > 0
                    ? `${rawCode.length.toLocaleString()} characters`
                    : "Minimum 10 characters required"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            id="review-btn"
            onClick={handleReview}
            disabled={!canSubmit}
            className={`mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
              canSubmit
                ? "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-purple-500/25 hover:scale-[1.01] active:scale-[0.99]"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Reviewing…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Review Code
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.div>

        {/* Loading / Results */}
        <div ref={resultsRef} className="mt-10">
          <AnimatePresence mode="wait">
            {loading && (
              <LoadingState key="loading" type={mode} />
            )}
            {result && !loading && (
              <motion.div key="result">
                <ReviewOutput result={result} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom features grid */}
        {!loading && !result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16 grid sm:grid-cols-2 gap-4"
          >
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 flex items-start gap-3"
              >
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <h3 className="font-semibold text-white text-sm">{f.label}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Footer */}
        {!loading && !result && (
          <footer className="mt-16 text-center text-gray-700 text-xs">
            CodeReview.live — Your AI Pair Reviewer
          </footer>
        )}
      </div>
    </div>
  );
}
