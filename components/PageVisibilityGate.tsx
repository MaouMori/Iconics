"use client";

import { ReactNode, useEffect, useState } from "react";
import { normalizePageVisibility, type PageVisibilityMap } from "@/lib/pageVisibility";

let cachedVisibility: PageVisibilityMap | null = null;

export function usePageVisibility() {
  const [visibility, setVisibility] = useState<PageVisibilityMap | null>(cachedVisibility);

  useEffect(() => {
    let mounted = true;

    async function loadVisibility() {
      const response = await fetch("/api/page-visibility", { cache: "no-store" }).catch(() => null);
      if (!response?.ok) {
        if (mounted) setVisibility(normalizePageVisibility(null));
        return;
      }

      const payload = await response.json().catch(() => null);
      const nextVisibility = normalizePageVisibility(payload?.visibility);
      cachedVisibility = nextVisibility;
      if (mounted) setVisibility(nextVisibility);
    }

    loadVisibility();

    return () => {
      mounted = false;
    };
  }, []);

  function isEnabled(key: string) {
    if (!visibility) return false;
    return visibility[key] !== false;
  }

  return { visibility, isEnabled, loading: !visibility };
}

export default function PageVisibilityGate({
  pageKey,
  children,
}: {
  pageKey: string;
  children: ReactNode;
}) {
  const { isEnabled } = usePageVisibility();

  if (!isEnabled(pageKey)) return null;
  return <>{children}</>;
}
