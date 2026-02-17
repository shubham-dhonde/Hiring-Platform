"use client";

import { TestResult } from "@/types";

interface TestResultsProps {
  results: TestResult[] | null;
  score: number;
  tierScores: Record<string, number> | null;
  hiddenSummary: { total: number; passed: number } | null;
  isRunning: boolean;
  onRunTests: () => void;
}

export default function TestResults({
  results,
  score,
  tierScores,
  hiddenSummary,
  isRunning,
  onRunTests,
}: TestResultsProps) {
  const visibleResults = results?.filter((r) => r.visible) ?? [];

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-700 rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700 bg-zinc-800">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-zinc-200">Test Results</h3>
          {results && (
            <span className="text-xs font-mono text-zinc-400">
              Score: {score}/100
            </span>
          )}
        </div>
        <button
          onClick={onRunTests}
          disabled={isRunning}
          className="px-3 py-1 text-xs font-medium bg-green-600 hover:bg-green-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded transition-colors"
        >
          {isRunning ? "Running..." : "Run Tests"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 text-sm">
        {!results && !isRunning && (
          <p className="text-zinc-500 text-center mt-4">
            Click &quot;Run Tests&quot; to test your solution
          </p>
        )}

        {isRunning && (
          <p className="text-zinc-400 text-center mt-4 animate-pulse">
            Running tests...
          </p>
        )}

        {results && (
          <div className="space-y-3">
            {/* Tier score bar */}
            {tierScores && (
              <div className="flex gap-1 h-3 rounded overflow-hidden bg-zinc-800">
                {[1, 2, 3, 4, 5].map((tier) => {
                  const maxPts = tier <= 2 ? 25 : tier <= 4 ? 20 : 10;
                  const pts = tierScores[`tier${tier}`] || 0;
                  const pct = (pts / maxPts) * 100;
                  return (
                    <div
                      key={tier}
                      className="relative flex-1"
                      title={`Tier ${tier}: ${pts}/${maxPts}`}
                    >
                      <div className="absolute inset-0 bg-zinc-700" />
                      <div
                        className="absolute inset-y-0 left-0 bg-green-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-mono z-10">
                        T{tier}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Visible test results (Tiers 1-2) */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 mb-1">
                Visible Tests (Tiers 1-2)
              </h4>
              <div className="space-y-1">
                {visibleResults.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 px-2 py-1 rounded text-xs ${
                      r.passed
                        ? "bg-green-900/30 text-green-300"
                        : "bg-red-900/30 text-red-300"
                    }`}
                  >
                    <span className="mt-0.5">{r.passed ? "✓" : "✗"}</span>
                    <div className="flex-1">
                      <span>{r.name}</span>
                      {r.error && (
                        <p className="text-red-400 text-[10px] mt-0.5 font-mono truncate">
                          {r.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hidden test summary (Tiers 3-5) */}
            {hiddenSummary && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 mb-1">
                  Hidden Tests (Tiers 3-5)
                </h4>
                <div className="px-2 py-1.5 rounded bg-zinc-800 text-xs text-zinc-300">
                  {hiddenSummary.passed}/{hiddenSummary.total} passing
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
