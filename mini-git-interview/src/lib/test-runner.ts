import ivm from "isolated-vm";
import { testSuite, tierPoints, tierTestCounts } from "./test-suite";
import { TestResult } from "@/types";

const ISOLATE_MEMORY_MB = 128;
const TEST_TIMEOUT_MS = 5000;

export interface RunTestsResult {
  results: TestResult[];
  score: number;
  tierScores: Record<string, number>;
}

export async function runTestsInIsolate(candidateCode: string): Promise<RunTestsResult> {
  const results: TestResult[] = [];

  const isolate = new ivm.Isolate({ memoryLimit: ISOLATE_MEMORY_MB });

  try {
    for (const test of testSuite) {
      let passed = false;
      let error: string | null = null;

      try {
        const context = await isolate.createContext();
        const jail = context.global;
        await jail.set("global", jail.derefInto);

        const script = await isolate.compileScript(`
          // Assertion helpers
          function assert(condition, message) {
            if (!condition) throw new Error(message || "Assertion failed");
          }
          function assertEqual(actual, expected) {
            if (actual !== expected) {
              throw new Error("Expected " + JSON.stringify(expected) + " but got " + JSON.stringify(actual));
            }
          }

          // Candidate code
          ${candidateCode}

          // Test
          (function() {
            ${test.fn}
          })();
        `);

        await script.run(context, { timeout: TEST_TIMEOUT_MS });
        passed = true;
      } catch (e: unknown) {
        const err = e as Error;
        if (err.message?.includes("Script execution timed out")) {
          error = "Test timed out (5s limit)";
        } else {
          error = err.message || "Unknown error";
        }
      }

      results.push({
        name: test.name,
        tier: test.tier,
        passed,
        error,
        visible: test.visible,
      });
    }
  } finally {
    isolate.dispose();
  }

  // Calculate tier scores
  const tierScores: Record<string, number> = {};
  for (let tier = 1; tier <= 5; tier++) {
    const tierResults = results.filter((r) => r.tier === tier);
    const passedCount = tierResults.filter((r) => r.passed).length;
    const totalCount = tierTestCounts[tier] || 1;
    const points = tierPoints[tier] || 0;
    tierScores[`tier${tier}`] = Math.round((passedCount / totalCount) * points * 100) / 100;
  }

  const score = Object.values(tierScores).reduce((sum, s) => sum + s, 0);

  return { results, score, tierScores };
}
