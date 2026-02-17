import { ContextInfo } from "@/types";

const MAX_MESSAGES = 5;
const MAX_TOKENS = 8000;
const MAX_EDITOR_TOKENS = 3000;

interface ChatMsg {
  role: "user" | "assistant" | "system";
  content: string;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const SYSTEM_PROMPT = `You are a helpful coding assistant embedded in a coding interview platform. The candidate is implementing a "Mini Git" - an in-memory version control system in JavaScript.

You can see the candidate's current code in the editor. Help them with:
- Explaining concepts about version control
- Debugging issues in their code
- Suggesting implementation approaches
- Answering questions about the problem requirements

The MiniGit class should implement these methods:
- init() - Initialize a repository
- add(filename, content) - Stage a file
- commit(message) - Create a commit, return a hash
- log() - Return commits in reverse chronological order [{hash, message}]
- branch(name) - Create a new branch
- checkout(branchName) - Switch branches
- status() - Return {staged: [filenames]}
- diff() - Return [{file, status, oldContent?, newContent?}]
- merge(branchName) - Merge branch, return {conflicts: [filenames]}

Be concise and helpful. Don't write the complete solution - guide the candidate.`;

export function buildChatMessages(
  recentMessages: ChatMsg[],
  editorCode: string
): { messages: ChatMsg[]; contextInfo: ContextInfo } {
  // Cap editor code tokens
  let codeSnippet = editorCode;
  if (estimateTokens(codeSnippet) > MAX_EDITOR_TOKENS) {
    const maxChars = MAX_EDITOR_TOKENS * 4;
    codeSnippet = codeSnippet.slice(0, maxChars) + "\n// ... (truncated)";
  }

  const systemMessage: ChatMsg = {
    role: "system",
    content: `${SYSTEM_PROMPT}\n\n--- Current Editor Code ---\n${codeSnippet}\n--- End Editor Code ---`,
  };

  const systemTokens = estimateTokens(systemMessage.content);
  let remainingTokens = MAX_TOKENS - systemTokens;

  // Take most recent messages up to limit
  const truncatedMessages: ChatMsg[] = [];
  const candidates = recentMessages.slice(-MAX_MESSAGES);

  for (let i = candidates.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(candidates[i].content);
    if (remainingTokens - msgTokens < 0) break;
    truncatedMessages.unshift(candidates[i]);
    remainingTokens -= msgTokens;
  }

  const totalTokens = MAX_TOKENS - remainingTokens;
  const contextInfo: ContextInfo = {
    messagesIncluded: truncatedMessages.length,
    maxMessages: MAX_MESSAGES,
    tokensUsed: totalTokens,
    maxTokens: MAX_TOKENS,
    percentUsed: Math.round((totalTokens / MAX_TOKENS) * 100),
  };

  return {
    messages: [systemMessage, ...truncatedMessages],
    contextInfo,
  };
}
