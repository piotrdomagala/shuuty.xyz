'use client';

import { useCallback, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import type { DocumentLanguage } from '@/components/documentLocale';

const LANGUAGE_SCROLL_KEY = 'shuuty-language-scroll';

type LanguageScrollRestore = Readonly<{
  targetPath: string;
  scrollY: number;
  anchorId?: string;
  anchorTop?: number;
}>;

const getLayoutTop = (element: HTMLElement) => {
  let top = 0;
  let current: HTMLElement | null = element;
  while (current) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
};

const getViewportAnchor = () => {
  const referenceTop = Math.min(120, window.innerHeight * 0.2);
  const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section[id]'));
  const anchor = sections.reduce<HTMLElement | null>((closest, section) => {
    if (!closest) return section;
    const distance = Math.abs(section.getBoundingClientRect().top - referenceTop);
    const closestDistance = Math.abs(closest.getBoundingClientRect().top - referenceTop);
    return distance < closestDistance ? section : closest;
  }, null);

  if (!anchor) return {};
  return { anchorId: anchor.id, anchorTop: getLayoutTop(anchor) - window.scrollY };
};

const persistLanguage = (language: DocumentLanguage) => {
  Cookies.set('lang', language, { expires: 365, sameSite: 'lax' });
  document.documentElement.lang = language;
};

const getLocalizedPath = (pathname: string, language: DocumentLanguage) => {
  const englishPath = pathname.replace(/^\/pl(?=\/|$)/, '') || '/';

  if (language === 'en') return englishPath;
  return englishPath === '/' ? '/pl/' : `/pl${englishPath}`;
};

export function useSiteLanguage(initialLanguage: DocumentLanguage = 'en') {
  const [language, setLanguage] = useState<DocumentLanguage>(initialLanguage);

  useEffect(() => {
    persistLanguage(initialLanguage);

    let firstFrame = 0;
    let secondFrame = 0;
    let restoreStyleFrame = 0;
    try {
      const stored = window.sessionStorage.getItem(LANGUAGE_SCROLL_KEY);
      if (!stored) return undefined;

      const restore = JSON.parse(stored) as Partial<LanguageScrollRestore>;
      if (restore.targetPath !== window.location.pathname || !Number.isFinite(restore.scrollY)) {
        return undefined;
      }

      window.sessionStorage.removeItem(LANGUAGE_SCROLL_KEY);
      const restorePosition = () => {
        const anchor = restore.anchorId ? document.getElementById(restore.anchorId) : null;
        const nextTop = anchor && Number.isFinite(restore.anchorTop)
          ? getLayoutTop(anchor) - (restore.anchorTop as number)
          : restore.scrollY as number;
        const root = document.documentElement;
        const previousScrollBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        window.scrollTo({ top: nextTop, behavior: 'auto' });
        restoreStyleFrame = window.requestAnimationFrame(() => {
          root.style.scrollBehavior = previousScrollBehavior;
        });
      };
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          restorePosition();
        });
      });
    } catch {
      // Navigation still works when session storage is unavailable.
    }

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.cancelAnimationFrame(restoreStyleFrame);
    };
  }, [initialLanguage]);

  const changeLanguage = useCallback((nextLanguage: DocumentLanguage) => {
    setLanguage(nextLanguage);
    persistLanguage(nextLanguage);

    const targetPath = getLocalizedPath(window.location.pathname, nextLanguage);
    if (targetPath !== window.location.pathname) {
      try {
        window.sessionStorage.setItem(LANGUAGE_SCROLL_KEY, JSON.stringify({
          targetPath,
          scrollY: window.scrollY,
          ...getViewportAnchor(),
        }));
      } catch {
        // Keep the route switch functional when session storage is unavailable.
      }
      window.location.assign(`${targetPath}${window.location.search}${window.location.hash}`);
    }
  }, []);

  return { language, changeLanguage };
}
