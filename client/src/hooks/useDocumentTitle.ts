import { useEffect } from "react";

/**
 * Sets `document.title` for the current view. Restores the previous title on unmount
 * so SPA navigations don't leave stale titles (e.g. "Sign in" after login).
 */
export function useDocumentTitle(title: string | undefined | null) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
