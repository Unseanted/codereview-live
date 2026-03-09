import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

function parseProviderResponse(content: string): ReviewResult {
  const cleanContent = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleanContent) as ReviewResult;

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

export async function reviewWithOpenAI(codeContent: string, context?: string): Promise<ReviewResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
  if (!content) throw new Error("Empty response from OpenAI");

  return parseProviderResponse(content);
}

export async function reviewWithClaude(codeContent: string, context?: string): Promise<ReviewResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const userMessage = context
    ? `${context}\n\n---\nCode to review:\n${codeContent}`
    : `Code to review:\n${codeContent}`;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: userMessage },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  });

  if (response.content[0].type !== "text") {
    throw new Error("Unexpected response format from Claude");
  }

  return parseProviderResponse(response.content[0].text);
}

export async function reviewWithGemini(codeContent: string, context?: string): Promise<ReviewResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const userMessage = context
    ? `${context}\n\n---\nCode to review:\n${codeContent}`
    : `Code to review:\n${codeContent}`;

  const prompt = `${SYSTEM_PROMPT}\n\n${userMessage}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });

  const content = result.response.text();
  if (!content) throw new Error("Empty response from Gemini");

  return parseProviderResponse(content);
}

export async function reviewWithGroq(codeContent: string, context?: string): Promise<ReviewResult> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY");
  }

  // Groq provides an OpenAI-compatible API
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const userMessage = context
    ? `${context}\n\n---\nCode to review:\n${codeContent}`
    : `Code to review:\n${codeContent}`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from Groq");

  return parseProviderResponse(content);
}

export async function reviewCodeFallback(codeContent: string, context?: string): Promise<ReviewResult> {
  // Check which keys are genuinely present (not just placeholders like sk-...)
  const hasOpenAI = !!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("sk-...");
  const hasClaude = !!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes("sk-ant-...");
  const hasGemini = !!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("AI...");
  const hasGroq = !!process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes("gsk_...");

  if (!hasOpenAI && !hasClaude && !hasGemini && !hasGroq) {
    throw new Error("No API keys provided. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY.");
  }

  const errors: string[] = [];

  if (hasOpenAI) {
    try {
      console.log("[llm] Attempting review with OpenAI...");
      return await reviewWithOpenAI(codeContent, context);
    } catch (error: any) {
      console.error("[llm] OpenAI failed:", error.message);
      errors.push(`OpenAI: ${error.message}`);
      console.warn("[llm] Falling back to next provider...");
    }
  }

  if (hasClaude) {
    try {
      console.log("[llm] Attempting review with Claude...");
      return await reviewWithClaude(codeContent, context);
    } catch (error: any) {
      console.error("[llm] Claude failed:", error.message);
      errors.push(`Claude: ${error.message}`);
      console.warn("[llm] Falling back to next provider...");
    }
  }

  if (hasGemini) {
    try {
      console.log("[llm] Attempting review with Gemini...");
      return await reviewWithGemini(codeContent, context);
    } catch (error: any) {
      console.error("[llm] Gemini failed:", error.message);
      errors.push(`Gemini: ${error.message}`);
      console.warn("[llm] Falling back to next provider...");
    }
  }

  if (hasGroq) {
    try {
      console.log("[llm] Attempting review with Groq...");
      return await reviewWithGroq(codeContent, context);
    } catch (error: any) {
      console.error("[llm] Groq failed:", error.message);
      errors.push(`Groq: ${error.message}`);
      console.warn("[llm] Falling back to next provider...");
    }
  }

  throw new Error(`Analysis failed. All configured providers failed. Errors: ${errors.join(" | ")}`);
}
