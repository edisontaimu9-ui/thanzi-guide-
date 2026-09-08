import { useEffect } from 'react';

const SITE_TITLE = 'Thanzi Guide';

// Sets document.title for the life of the mounted page, restoring the
// previous title on unmount. Pass undefined while data is still loading
// so the tab doesn't flash a wrong title before falling back to the real one.
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} | ${SITE_TITLE}` : `${SITE_TITLE} | Health & Nutrition Education for Malawi`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
