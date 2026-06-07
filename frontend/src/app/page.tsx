"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { DocumentSidebar } from "@/components/DocumentSidebar";
import { StatusBar } from "@/components/StatusBar";
import { UploadPanel } from "@/components/UploadPanel";
import { useDocuments } from "@/hooks/useDocuments";

export default function Home() {
  const { refresh } = useDocuments();
  const [uploadOpen, setUploadOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-full flex flex-col relative">
      {/* Top nav */}
      <header className="relative z-20 flex items-center justify-between px-6 py-3 border-b border-white/8 bg-white/2 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white/90 tracking-tight">
            RAG Intelligence
          </span>
        </div>

        <div className="flex items-center gap-3">
          <StatusBar />
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                sidebarOpen
                  ? "bg-white/10 text-white/80"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Docs
            </button>
            <button
              onClick={() => setUploadOpen((v) => !v)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                uploadOpen
                  ? "bg-white/10 text-white/80"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Upload
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 shrink-0 border-r border-white/8 overflow-hidden">
            <DocumentSidebar />
          </aside>
        )}

        {/* Chat (always visible) */}
        <main className="flex-1 overflow-hidden">
          <ChatPanel />
        </main>

        {/* Upload panel */}
        {uploadOpen && (
          <aside className="w-72 shrink-0 border-l border-white/8 overflow-hidden">
            <UploadPanel onUploadSuccess={refresh} />
          </aside>
        )}
      </div>
    </div>
  );
}
