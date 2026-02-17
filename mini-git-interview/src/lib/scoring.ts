import { prisma } from "./db";
import { ProcessSignals, AIAdoptionSignals, ScoringResult } from "@/types";

export async function computeScore(sessionId: string): Promise<ScoringResult> {
  const [events, chatMessages, testRuns] = await Promise.all([
    prisma.event.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
    }),
    prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
    }),
    prisma.testRun.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
    }),
  ]);

  // Correctness: latest test run score
  const latestTestRun = testRuns[testRuns.length - 1];
  const correctness = latestTestRun?.score ?? 0;

  // Process signals
  const changeEvents = events.filter((e) => e.type === "change");
  const testRunEvents = events.filter((e) => e.type === "test_run");
  const pasteEvents = events.filter((e) => e.type === "paste");

  const firstTestRunEvent = testRunEvents[0];
  const sessionStart = events[0]?.timestamp;

  let timeToFirstTestRun: number | null = null;
  if (firstTestRunEvent && sessionStart) {
    timeToFirstTestRun =
      new Date(firstTestRunEvent.timestamp).getTime() -
      new Date(sessionStart).getTime();
  }

  // Edit-test cycles: count transitions from change -> test_run
  let editTestCycles = 0;
  let lastType: string | null = null;
  for (const event of events) {
    if (event.type === "test_run" && lastType === "change") {
      editTestCycles++;
    }
    if (event.type === "change" || event.type === "test_run") {
      lastType = event.type;
    }
  }

  // Average time between test runs
  let avgTimeBetweenTestRuns: number | null = null;
  if (testRunEvents.length > 1) {
    let totalGap = 0;
    for (let i = 1; i < testRunEvents.length; i++) {
      totalGap +=
        new Date(testRunEvents[i].timestamp).getTime() -
        new Date(testRunEvents[i - 1].timestamp).getTime();
    }
    avgTimeBetweenTestRuns = totalGap / (testRunEvents.length - 1);
  }

  const processSignals: ProcessSignals = {
    totalEditorChanges: changeEvents.length,
    testRunCount: testRunEvents.length,
    timeToFirstTestRun,
    editTestCycles,
    pasteEvents: pasteEvents.length,
    avgTimeBetweenTestRuns,
  };

  // AI adoption signals
  const userMessages = chatMessages.filter((m) => m.role === "user");
  const avgPromptLength =
    userMessages.length > 0
      ? userMessages.reduce((sum, m) => sum + m.content.length, 0) /
        userMessages.length
      : 0;

  const questionsAsked = userMessages.filter((m) =>
    m.content.includes("?")
  ).length;

  const codeRequestCount = userMessages.filter((m) => {
    const lower = m.content.toLowerCase();
    return (
      lower.includes("write") ||
      lower.includes("implement") ||
      lower.includes("code") ||
      lower.includes("function") ||
      lower.includes("create")
    );
  }).length;

  const totalTokensUsed = chatMessages.reduce(
    (sum, m) => sum + m.tokensUsed,
    0
  );

  // Messages before/after first test run
  let messagesBeforeFirstTestRun = 0;
  let messagesAfterFirstTestRun = 0;
  const firstTestRunTime = firstTestRunEvent
    ? new Date(firstTestRunEvent.timestamp).getTime()
    : null;

  for (const msg of userMessages) {
    if (
      firstTestRunTime &&
      new Date(msg.timestamp).getTime() < firstTestRunTime
    ) {
      messagesBeforeFirstTestRun++;
    } else {
      messagesAfterFirstTestRun++;
    }
  }

  const aiAdoptionSignals: AIAdoptionSignals = {
    totalMessages: userMessages.length,
    avgPromptLength: Math.round(avgPromptLength),
    questionsAsked,
    codeRequestCount,
    totalTokensUsed,
    messagesBeforeFirstTestRun,
    messagesAfterFirstTestRun,
  };

  return {
    correctness,
    processSignals,
    aiAdoptionSignals,
  };
}
