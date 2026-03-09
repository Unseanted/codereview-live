import { NextRequest, NextResponse } from "next/server";
import { ReviewRequestSchema } from "@/lib/utils";
import { parsePRUrl, fetchPRFiles, buildCodeContext } from "@/lib/github";
import { reviewCode } from "@/lib/openai";

export const maxDuration = 60; // allow up to 60s on Vercel

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ReviewRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    let codeContent: string;
    let context: string | undefined;

    if (data.type === "github_pr") {
      const { owner, repo, pullNumber } = parsePRUrl(data.value);
      const { files, title, description } = await fetchPRFiles(
        owner,
        repo,
        pullNumber
      );

      if (!files.length) {
        return NextResponse.json(
          { error: "No changed files found in this PR." },
          { status: 422 }
        );
      }

      codeContent = buildCodeContext(files);
      context = `PR: ${title}${description ? `\nDescription: ${description.slice(0, 500)}` : ""}`;
    } else {
      codeContent = data.value;
      if (data.language) {
        context = `Language: ${data.language}`;
      }
    }

    if (!codeContent.trim()) {
      return NextResponse.json(
        { error: "No code content to review." },
        { status: 422 }
      );
    }

    const result = await reviewCode(codeContent, context);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/review]", err);
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
