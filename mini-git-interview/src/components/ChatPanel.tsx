"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ContextInfo } from "@/types";
import ContextIndicator from "./ContextIndicator";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  sessionId: string;
  editorCode: string;
  onChatSend?: () => void;
}

export default function ChatPanel({ sessionId, editorCode, onChatSend }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [contextInfo, setContextInfo] = useState<ContextInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setIsLoading(true);
    setStreamingContent("");
    onChatSend?.();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: trimmed,
          editorCode,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.contextInfo) {
              setContextInfo(parsed.contextInfo);
            }
            if (parsed.content) {
              fullContent += parsed.content;
              setStreamingContent(fullContent);
            }
            if (parsed.error) {
              fullContent += `\n[Error: ${parsed.error}]`;
              setStreamingContent(fullContent);
            }
          } catch {
            // ignore parse errors from partial frames
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullContent },
      ]);
      setStreamingContent("");
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "[Error: Failed to get response]" },
      ]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-700 rounded-md overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-700 bg-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-200">AI Assistant</h3>
      </div>

      <ContextIndicator contextInfo={contextInfo} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && !isLoading && (
          <p className="text-zinc-500 text-sm text-center mt-8">
            Ask questions about the problem or your code.
            <br />
            <span className="text-xs text-zinc-600">
              Context is limited to the last 5 messages.
            </span>
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm ${
              msg.role === "user" ? "text-blue-300" : "text-zinc-300"
            }`}
          >
            <span className="text-xs font-semibold text-zinc-500 block mb-0.5">
              {msg.role === "user" ? "You" : "Assistant"}
            </span>
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
          </div>
        ))}

        {streamingContent && (
          <div className="text-sm text-zinc-300">
            <span className="text-xs font-semibold text-zinc-500 block mb-0.5">
              Assistant
            </span>
            <div className="whitespace-pre-wrap break-words">
              {streamingContent}
              <span className="inline-block w-1.5 h-4 bg-zinc-400 animate-pulse ml-0.5 align-text-bottom" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-zinc-700">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask a question... (Shift+Enter for newline)"
            rows={2}
            className="flex-1 bg-zinc-800 border border-zinc-600 rounded px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:border-zinc-400 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded transition-colors self-end"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
