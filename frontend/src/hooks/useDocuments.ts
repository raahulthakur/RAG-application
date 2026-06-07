"use client";

import { useCallback, useEffect, useState } from "react";
import { listDocuments } from "@/lib/api";

export function useDocuments() {
  const [documents, setDocuments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listDocuments();
      setDocuments(data.documents ?? []);
    } catch {
      // silently fail — documents panel is non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { documents, isLoading, refresh };
}
