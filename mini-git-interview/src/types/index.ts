// Session types
export interface SessionData {
  id: string;
  startedAt: string;
  endedAt: string | null;
  events: SessionEvent[];
  chatMessages: ChatMessageData[];
  testRuns: TestRunData[];
}

// Event types
export type EventType =
  | "keystroke"
  | "change"
  | "paste"
  | "focus"
  | "blur"
  | "chat_send"
  | "test_run"
  | "snapshot";

export interface SessionEvent {
  id: string;
  sessionId: string;
  type: EventType;
  data: string;
  timestamp: string;
}

export interface EditorChangeEventData {
  changes: Array<{
    range: { startLine: number; endLine: number };
    text: string;
  }>;
  fullContent?: string;
}

export interface PasteEventData {
  text: string;
  position: { line: number; column: number };
}

// Chat types
export interface ChatMessageData {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokensUsed: number;
  timestamp: string;
}

export interface ContextInfo {
  messagesIncluded: number;
  maxMessages: number;
  tokensUsed: number;
  maxTokens: number;
  percentUsed: number;
}

export interface ChatStreamChunk {
  content: string;
  contextInfo?: ContextInfo;
}

// Test types
export type TestTier = 1 | 2 | 3 | 4 | 5;

export interface TestCase {
  name: string;
  tier: TestTier;
  visible: boolean;
  fn: string;
}

export interface TestResult {
  name: string;
  tier: TestTier;
  passed: boolean;
  error: string | null;
  visible: boolean;
}

export interface TestRunData {
  id: string;
  sessionId: string;
  results: TestResult[];
  score: number;
  tier1Score: number;
  tier2Score: number;
  tier3Score: number;
  tier4Score: number;
  tier5Score: number;
  timestamp: string;
}

export interface TestRunResponse {
  results: TestResult[];
  score: number;
  tierScores: {
    tier1: number;
    tier2: number;
    tier3: number;
    tier4: number;
    tier5: number;
  };
  visibleResults: TestResult[];
  hiddenSummary: {
    total: number;
    passed: number;
  };
}

// Scoring types
export interface ProcessSignals {
  totalEditorChanges: number;
  testRunCount: number;
  timeToFirstTestRun: number | null;
  editTestCycles: number;
  pasteEvents: number;
  avgTimeBetweenTestRuns: number | null;
}

export interface AIAdoptionSignals {
  totalMessages: number;
  avgPromptLength: number;
  questionsAsked: number;
  codeRequestCount: number;
  totalTokensUsed: number;
  messagesBeforeFirstTestRun: number;
  messagesAfterFirstTestRun: number;
}

export interface ScoringResult {
  correctness: number;
  processSignals: ProcessSignals;
  aiAdoptionSignals: AIAdoptionSignals;
}
