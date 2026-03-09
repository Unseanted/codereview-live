import { z } from "zod";

export const ReviewRequestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("github_pr"),
    value: z
      .string()
      .url("Must be a valid URL")
      .regex(
        /github\.com\/[^/]+\/[^/]+\/pull\/\d+/,
        "Must be a valid GitHub PR URL (e.g. https://github.com/owner/repo/pull/123)"
      ),
  }),
  z.object({
    type: z.literal("raw_code"),
    value: z.string().min(10, "Code must be at least 10 characters"),
    language: z.string().optional(),
  }),
]);

export type ReviewRequest = z.infer<typeof ReviewRequestSchema>;

export const SEVERITY_ORDER = {
  critical: 0,
  major: 1,
  minor: 2,
  info: 3,
} as const;

export const SEVERITY_LABELS = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
  info: "Info",
} as const;

export const SEVERITY_COLORS = {
  critical: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
    dot: "bg-red-500",
    badge: "bg-red-500/20 text-red-300 border border-red-500/40",
  },
  major: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-500/30",
    dot: "bg-orange-500",
    badge: "bg-orange-500/20 text-orange-300 border border-orange-500/40",
  },
  minor: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    dot: "bg-yellow-500",
    badge: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40",
  },
  info: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
    dot: "bg-blue-500",
    badge: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
  },
} as const;

export const CATEGORY_CONFIG = {
  bugs: {
    label: "Bugs",
    icon: "🐛",
    description: "Logic errors, crashes, and incorrect behavior",
    emptyMessage: "No bugs detected — great job!",
  },
  performance: {
    label: "Performance",
    icon: "⚡",
    description: "Inefficiencies, memory issues, and optimization opportunities",
    emptyMessage: "No performance concerns found.",
  },
  style: {
    label: "Style",
    icon: "🎨",
    description: "Code style, readability, and best practices",
    emptyMessage: "Code style looks clean!",
  },
  security: {
    label: "Security",
    icon: "🔒",
    description: "Vulnerabilities, injection risks, and data exposure",
    emptyMessage: "No security issues detected.",
  },
} as const;

export type CategoryKey = keyof typeof CATEGORY_CONFIG;
