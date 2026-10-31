"use client";

import { useEffect, useState } from "react";
import { revokeObjectUrlSafely } from "@/lib/utils/memory";

/**
 * Custom hook to safely generate and automatically revoke browser Object URLs.
 * Prevents memory leaks by ensuring the URL is revoked when the blob changes or component unmounts.
 */
export function useObjectUrl(blobOrFile: Blob | File | null): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blobOrFile) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(blobOrFile);
    setObjectUrl(url);

    return () => {
      revokeObjectUrlSafely(url);
    };
  }, [blobOrFile]);

  return objectUrl;
}
