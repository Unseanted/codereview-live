import OpenAI from "openai";

export interface ReviewItem {
  severity: "critical" | "major" | "minor" | "info";
  file?: string;
  line?: number;
  title: string;
  description: string;
  suggestion: string;
  code?: string;
}

export interface ReviewResult {
  summary: string;
  overallScore: number; // 1–10
  categories: {
    bugs: ReviewItem[];
    performance: ReviewItem[];
    style: ReviewItem[];
    security: ReviewItem[];
  };
  totalIssues: number;
}

const SYSTEM_PROMPT = `You are an expert code reviewer. Analyze the provided code or git diff and return a structured JSON review.

Your response MUST be valid JSON matching exactly this schema:
{
  "summary": "2-3 sentence overall summary of the code quality",
  "overallScore": <integer 1-10, 10 being perfect>,
  "categories": {
    "bugs": [
      {
        "severity": "critical|major|minor|info",
        "file": "optional filename",
        "line": optional_line_number,
        "title": "Short issue title",
        "description": "Detailed explanation of the problem",
        "suggestion": "Concrete recommendation to fix it",
        "code": "optional corrected code snippet"
      }
    ],
    "performance": [...same shape],
    "style": [...same shape],
    "security": [...same shape]
  },
  "totalIssues": <total count of all items across all categories>
}

Rules:
- Return ONLY raw JSON, no markdown code fences, no explanation outside the JSON
- Each category array can be empty [] if no issues found
- Be specific and actionable in every item
- severity: "critical" = likely crash/data loss; "major" = significant issue; "minor" = small concern; "info" = suggestion/best practice
- If the code is short/simple, still provide meaningful analysis
- Score 10 only for truly exceptional code`;

export async function reviewCode(
  codeContent: string,
  context?: string
): Promise<ReviewResult> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const userMessage = context
    ? `${context}\n\n---\nCode to review:\n${codeContent}`
    : `Code to review:\n${codeContent}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const parsed = JSON.parse(content) as ReviewResult;

  // Defensive defaults
  parsed.categories = parsed.categories || {};
  parsed.categories.bugs = parsed.categories.bugs || [];
  parsed.categories.performance = parsed.categories.performance || [];
  parsed.categories.style = parsed.categories.style || [];
  parsed.categories.security = parsed.categories.security || [];
  parsed.totalIssues =
    parsed.categories.bugs.length +
    parsed.categories.performance.length +
    parsed.categories.style.length +
    parsed.categories.security.length;

  return parsed;
}
