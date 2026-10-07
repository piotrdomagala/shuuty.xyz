'use client';

import { useEffect } from 'react';

// The 404 page is one static file for every language. Next.js writes the
// English metadata title while the page starts (and may write it again), so
// the title in the page's language is kept from the language the layout put
// on <html> for as long as the page is open.
export default function NotFoundTitle({ titles }: Readonly<{ titles: Record<string, string> }>) {
  useEffect(() => {
    const title = titles[document.documentElement.lang];
    if (!title) return undefined;
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [titles]);
  return null;
}
