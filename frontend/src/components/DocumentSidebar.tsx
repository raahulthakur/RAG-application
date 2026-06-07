"use client";

import { useDocuments } from "@/hooks/useDocuments";

export function DocumentSidebar() {
  const { documents, isLoading, refresh } = useDocuments();

  const filename = (path: string) => path.split("/").pop() ?? path;

  return (
    <div className="flex flex-col h-full relative z-10">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div>
          <h2 className="text-base font-semibold text-white">Documents</h2>
          <p className="text-xs text-white/40">
            {documents.length} file{documents.length !== 1 ? "s" : ""} indexed
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5 transition-all disabled:opacity-30"
          title="Refresh"
        >
          <svg
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-white/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-white/40 font-medium">No documents yet</p>
            <p className="text-xs text-white/25 mt-1">
              Upload a PDF to get started
            </p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/12 transition-all group cursor-default"
            >
              <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <svg
                  className="w-3.5 h-3.5 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p
                className="text-xs text-white/60 group-hover:text-white/80 truncate transition-colors"
                title={doc}
              >
                {filename(doc)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
