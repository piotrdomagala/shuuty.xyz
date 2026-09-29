'use client';

import { useCallback, useEffect, useId, useRef, useState, type FocusEvent } from 'react';
import type { SiteLanguage } from '@/components/documentLocale';
import styles from './LanguageMenu.module.css';

// Each language is named in itself, so a visitor finds their own language
// whatever page they are on.
const nativeNames: Record<SiteLanguage, string> = {
  en: 'English',
  pl: 'Polski',
  nb: 'Norsk',
};

const codes: Record<SiteLanguage, string> = { en: 'EN', pl: 'PL', nb: 'NB' };

interface LanguageMenuProps {
  language: SiteLanguage;
  languages: readonly SiteLanguage[];
  label: string;
  onLanguageChange: (language: SiteLanguage) => void;
}

// One compact button that opens the language list. The list stays in the static
// HTML (hidden until opened), so crawlers and the export validator still see
// every language target.
export default function LanguageMenu({
  language,
  languages,
  label,
  onLanguageChange,
}: Readonly<LanguageMenuProps>) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const current = rootRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    current?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (open && !rootRef.current?.contains(event.relatedTarget as Node | null)) close(false);
  };

  const choose = (code: SiteLanguage) => {
    close(true);
    if (code !== language) onLanguageChange(code);
  };

  return (
    <div className={styles.root} ref={rootRef} onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${nativeNames[language]}`}
        title={label}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={styles.globe}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
        </svg>
        <span className={styles.code}>{codes[language]}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={styles.chevron}>
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      <ul id={listId} className={styles.list} hidden={!open} aria-label={label}>
        {languages.map((code) => (
          <li key={code}>
            <button
              type="button"
              className={styles.option}
              lang={code}
              data-site-language={code}
              aria-pressed={language === code}
              onClick={() => choose(code)}
            >
              <span className={styles.optionCode} aria-hidden="true">
                {codes[code]}
              </span>
              <span>{nativeNames[code]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
