"use client";

import { ContextInfo } from "@/types";

interface ContextIndicatorProps {
  contextInfo: ContextInfo | null;
}

export default function ContextIndicator({ contextInfo }: ContextIndicatorProps) {
  if (!contextInfo) return null;

  const pct = contextInfo.percentUsed;
  const barColor =
    pct < 60 ? "bg-green-500" : pct < 85 ? "bg-yellow-500" : "bg-red-500";
  const textColor =
    pct < 60 ? "text-green-400" : pct < 85 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-700 bg-zinc-800/50 text-xs">
      <span className="text-zinc-400">
        Context: {contextInfo.messagesIncluded}/{contextInfo.maxMessages} msgs
      </span>
      <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`font-mono ${textColor}`}>{pct}%</span>
    </div>
  );
}
