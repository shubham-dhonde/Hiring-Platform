"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const startInterview = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/session/start", { method: "POST" });
      const { sessionId } = await res.json();
      router.push(`/interview?session=${sessionId}`);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <main className="max-w-xl w-full mx-auto px-6 text-center">
        <h1 className="text-4xl font-bold text-zinc-100 mb-4">
          Mini Git Interview
        </h1>
        <p className="text-lg text-zinc-400 mb-2">
          Coding Interview Platform
        </p>
        <p className="text-sm text-zinc-500 mb-8 max-w-md mx-auto">
          Implement an in-memory version control system in JavaScript. You&apos;ll have
          access to a code editor, a test runner, and an AI assistant to help you
          along the way.
        </p>

        <div className="space-y-4">
          <button
            onClick={startInterview}
            disabled={isLoading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-lg"
          >
            {isLoading ? "Starting..." : "Start Interview"}
          </button>

          <div className="text-xs text-zinc-600 space-y-1">
            <p>No login required. Your session will be recorded.</p>
            <p>Use Ctrl+Enter to run tests at any time.</p>
          </div>
        </div>

        <div className="mt-12 text-left bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-400">
          <h3 className="font-semibold text-zinc-300 mb-2">What to expect:</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>Implement a MiniGit class with 9 methods</li>
            <li>Tiers 1-2 tests are visible, Tiers 3-5 are hidden</li>
            <li>AI assistant with limited context (last 5 messages)</li>
            <li>All keystrokes and interactions are recorded</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
