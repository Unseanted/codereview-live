export interface PRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
  raw_url?: string;
}

export interface ParsedPRUrl {
  owner: string;
  repo: string;
  pullNumber: number;
}

export function parsePRUrl(url: string): ParsedPRUrl {
  const match = url.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
  );
  if (!match) {
    throw new Error(
      "Invalid GitHub PR URL. Expected format: https://github.com/owner/repo/pull/123"
    );
  }
  return {
    owner: match[1],
    repo: match[2],
    pullNumber: parseInt(match[3], 10),
  };
}

export async function fetchPRFiles(
  owner: string,
  repo: string,
  pullNumber: number
): Promise<{ files: PRFile[]; title: string; description: string }> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "CodeReview.live",
  };

  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  // Fetch PR metadata
  const prRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
    { headers }
  );
  if (!prRes.ok) {
    const err = await prRes.json().catch(() => ({}));
    throw new Error(
      `GitHub API error: ${prRes.status} — ${(err as { message?: string }).message || prRes.statusText}`
    );
  }
  const prData = await prRes.json() as { title: string; body: string };

  // Fetch changed files (up to 300)
  const filesRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100`,
    { headers }
  );
  if (!filesRes.ok) {
    throw new Error(`Failed to fetch PR files: ${filesRes.status}`);
  }
  const files = await filesRes.json() as PRFile[];

  return {
    files,
    title: prData.title || "",
    description: prData.body || "",
  };
}

export function buildCodeContext(
  files: PRFile[],
  maxChars = 32000
): string {
  let context = "";
  for (const file of files) {
    if (!file.patch) continue;
    const snippet = `\n\n### File: ${file.filename}\n\`\`\`diff\n${file.patch}\n\`\`\``;
    if (context.length + snippet.length > maxChars) {
      context += "\n\n[...additional files truncated due to length limit]";
      break;
    }
    context += snippet;
  }
  return context;
}
