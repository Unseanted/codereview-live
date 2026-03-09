import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CodeReview.live — AI Pair Reviewer",
  description:
    "Paste a GitHub PR URL or raw code and get instant, structured code review with AI. Analyzes bugs, performance, style, and security.",
  keywords: ["code review", "AI", "GitHub", "developer tools", "GPT-4"],
  openGraph: {
    title: "CodeReview.live — AI Pair Reviewer",
    description: "AI-powered code review in seconds. Bugs, performance, style, security.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔍</text></svg>" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
