"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ingestPDF } from "@/lib/api";

interface UploadPanelProps {
  onUploadSuccess: () => void;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export function UploadPanel({ onUploadSuccess }: UploadPanelProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setPendingFile(accepted[0]);
      setUploadState("idle");
      setMessage("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploadState("uploading");
    setMessage("");
    try {
      await ingestPDF(pendingFile);
      setUploadState("success");
      setMessage(`"${pendingFile.name}" ingestion started`);
      setPendingFile(null);
      setTimeout(() => {
        onUploadSuccess();
      }, 1500);
    } catch (err) {
      setUploadState("error");
      setMessage(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <div className="flex flex-col h-full relative z-10">
      <div className="px-6 py-4 border-b border-white/8">
        <h2 className="text-base font-semibold text-white">Upload PDF</h2>
        <p className="text-xs text-white/40">Add documents to your knowledge base</p>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-4">
        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-indigo-400 bg-indigo-500/10"
              : "border-white/15 hover:border-indigo-500/50 hover:bg-white/3"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                isDragActive
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "bg-white/5 text-white/40"
              }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white/70">
                {isDragActive ? "Drop it here" : "Drag & drop a PDF"}
              </p>
              <p className="text-xs text-white/30 mt-0.5">or click to browse</p>
            </div>
          </div>
        </div>

        {/* Pending file preview */}
        {pendingFile && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 text-red-400"
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
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 truncate">{pendingFile.name}</p>
              <p className="text-xs text-white/30">
                {(pendingFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => setPendingFile(null)}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!pendingFile || uploadState === "uploading"}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-all bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white active:scale-[0.98] shadow-lg shadow-indigo-600/20"
        >
          {uploadState === "uploading" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading…
            </span>
          ) : (
            "Upload & Ingest"
          )}
        </button>

        {/* Status message */}
        {message && (
          <div
            className={`px-4 py-3 rounded-xl text-sm ${
              uploadState === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
          >
            {uploadState === "success" && (
              <span className="mr-2">✓</span>
            )}
            {message}
            {uploadState === "success" && (
              <p className="text-xs opacity-70 mt-0.5">
                Ready to query — start asking questions.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
