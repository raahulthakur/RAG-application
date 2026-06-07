"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SourceChip } from "./SourceChip";
import type { Message } from "@/types";

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%]">
          <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-gradient-to-br from-indigo-600 to-indigo-500 text-white text-sm leading-relaxed shadow-lg shadow-indigo-500/20">
            {message.content}
          </div>
          <p className="text-xs text-white/30 mt-1 text-right">
            {timeAgo(message.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold mt-0.5">
        AI
      </div>
      <div className="flex-1 min-w-0">
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 border-l-2 border-l-indigo-500/50 backdrop-blur-sm text-sm text-white/90 leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ children, className }) {
                const isBlock = className?.includes("language-");
                if (isBlock) {
                  return (
                    <pre className="bg-black/30 rounded-lg p-3 overflow-x-auto my-2 border border-white/10">
                      <code className="text-indigo-200 text-xs font-mono">
                        {children}
                      </code>
                    </pre>
                  );
                }
                return (
                  <code className="bg-indigo-500/15 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                );
              },
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>;
              },
              ul({ children }) {
                return (
                  <ul className="list-disc list-inside mb-2 space-y-1">
                    {children}
                  </ul>
                );
              },
              ol({ children }) {
                return (
                  <ol className="list-decimal list-inside mb-2 space-y-1">
                    {children}
                  </ol>
                );
              },
              strong({ children }) {
                return (
                  <strong className="text-white font-semibold">{children}</strong>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.sources.map((src, i) => (
              <SourceChip key={src} source={src} index={i} />
            ))}
          </div>
        )}
        <p className="text-xs text-white/30 mt-1.5">
          {timeAgo(message.timestamp)}
          {message.num_contexts !== undefined && (
            <span className="ml-2 text-white/20">
              · {message.num_contexts} context
              {message.num_contexts !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
