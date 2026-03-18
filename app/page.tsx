'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Cookies from 'js-cookie';
import s from './page.module.css';

/* ═══ i18n ═══ */

type Lang = 'en' | 'pl';

const t = {
  en: {
    nav: { features: 'Features', how: 'How it works', download: 'Download' },
    hero: {
      badge: 'Now on iOS & Android',
      h1_1: 'From idea',
      h1_2: 'to action.',
      sub: 'Meet like-minded people, organize meetings, create groups, and delegate tasks — all in one app.',
    },
    features: {
      label: 'Features',
      heading: 'Everything you need to\nmeet, plan & act',
      items: [
        {
          title: 'Get things done',
          desc: 'Delegate tasks, set timers, track progress — by voice, checklist, or photo.',
        },
        {
          title: 'Plan together',
          desc: 'Pick a topic, choose a place, set the time. The right people show up.',
        },
        {
          title: 'Build your crew',
          desc: 'One space for your team or hobby circle — shared tasks, meetings, and chat.',
        },
        {
          title: 'Discover nearby',
          desc: 'See what\'s happening around you. Find activities and people who share your interests.',
        },
      ],
    },
    how: {
      label: 'How it works',
      heading: 'Three steps.\nThat\'s it.',
      steps: [
        { title: 'Pick your interests', desc: 'Choose from 1,000+ interests across sports, music, tech, food, travel, and more.' },
        { title: 'Find your people', desc: 'We match you with nearby activities and people who care about the same things.' },
        { title: 'Make it happen', desc: 'Join a meeting, start a group, delegate a task. Ideas become plans. Plans become action.' },
      ],
    },
    showcase: {
      label: 'The app',
      items: [
        { title: 'Your day, organized', desc: 'A personal dashboard that shows tasks, meetings, and what needs your attention — all in one place.' },
        { title: 'See what\'s around you', desc: 'An interactive map that surfaces activities nearby, tailored to what you actually enjoy.' },
        { title: 'Do it together', desc: 'Delegate tasks, track progress, and chat — all within the context of your meetings and groups.' },
      ],
    },
    faq: {
      label: 'FAQ',
      heading: 'Questions, answered',
      items: [
        { q: 'Is Shuuty free?', a: 'Yes. The core experience is free. We offer optional Pro and Teams plans for power users who want more.' },
        { q: 'Who is it for?', a: 'Anyone who wants to organize activities, meet like-minded people, or manage shared tasks — from hobby groups to small teams.' },
        { q: 'How does matching work?', a: 'When you sign up, you pick from over 1,000 interests. We use those plus your location to surface relevant meetings, groups, and people near you.' },
        { q: 'Can I create tasks by voice?', a: 'Yes. Tap the mic, describe your task, and we\'ll extract the title, date, assignee, and location automatically.' },
        { q: 'Is my data safe?', a: 'Absolutely. Your data is encrypted, never sold, and you can delete your account at any time.' },
      ],
    },
    cta: {
      heading: 'Ready to act?',
      sub: 'Available on iOS and Android. Free to download.',
    },
    store: { apple: 'App Store', google: 'Google Play', applePrefix: 'Download on the', googlePrefix: 'Get it on' },
    download: 'Get the app',
    support: 'Support',
    privacy: 'Privacy',
    terms: 'Terms',
    footer: '© 2026 Shuuty. All rights reserved.',
  },
  pl: {
    nav: { features: 'Funkcje', how: 'Jak to działa', download: 'Pobierz' },
    hero: {
      badge: 'Teraz na iOS i Android',
      h1_1: 'Od pomysłu',
      h1_2: 'do działania.',
      sub: 'Poznawaj ludzi o podobnych pasjach, organizuj spotkania, twórz grupy i deleguj zadania — wszystko w jednej aplikacji.',
    },
    features: {
      label: 'Funkcje',
      heading: 'Wszystko, czego potrzebujesz,\nby spotkać, planować i działać',
      items: [
        {
          title: 'Realizuj zadania',
          desc: 'Deleguj, ustawiaj timery, śledź postępy — głosem, checklistą lub zdjęciem.',
        },
        {
          title: 'Planuj wspólnie',
          desc: 'Wybierz temat, miejsce i czas. Odpowiedni ludzie się pojawią.',
        },
        {
          title: 'Zbuduj swoją ekipę',
          desc: 'Jedno miejsce dla zespołu lub grupy hobby — wspólne zadania, spotkania i czat.',
        },
        {
          title: 'Odkrywaj w okolicy',
          desc: 'Zobacz, co dzieje się wokół Ciebie. Znajdź aktywności i ludzi o podobnych zainteresowaniach.',
        },
      ],
    },
    how: {
      label: 'Jak to działa',
      heading: 'Trzy kroki.\nTo wszystko.',
      steps: [
        { title: 'Wybierz zainteresowania', desc: 'Ponad 1000 zainteresowań: sport, muzyka, technologia, jedzenie, podróże i więcej.' },
        { title: 'Znajdź ludzi', desc: 'Dopasujemy Cię do aktywności i osób w okolicy, które interesują się tym samym.' },
        { title: 'Zacznij działać', desc: 'Dołącz do spotkania, załóż grupę, deleguj zadanie. Pomysły stają się planami. Plany stają się działaniem.' },
      ],
    },
    showcase: {
      label: 'Aplikacja',
      items: [
        { title: 'Twój dzień, uporządkowany', desc: 'Osobisty dashboard z zadaniami, spotkaniami i tym, co wymaga Twojej uwagi — w jednym miejscu.' },
        { title: 'Zobacz, co jest wokół', desc: 'Interaktywna mapa z aktywnościami w okolicy, dopasowanymi do Twoich zainteresowań.' },
        { title: 'Działaj razem', desc: 'Deleguj zadania, śledź postępy i czatuj — w kontekście spotkań i grup.' },
      ],
    },
    faq: {
      label: 'FAQ',
      heading: 'Pytania i odpowiedzi',
      items: [
        { q: 'Czy Shuuty jest darmowe?', a: 'Tak. Podstawowe funkcje są darmowe. Oferujemy opcjonalne plany Pro i Teams dla zaawansowanych użytkowników.' },
        { q: 'Dla kogo jest Shuuty?', a: 'Dla każdego, kto chce organizować aktywności, poznawać podobnych ludzi lub zarządzać wspólnymi zadaniami.' },
        { q: 'Jak działa dopasowanie?', a: 'Przy rejestracji wybierasz z ponad 1000 zainteresowań. Na ich podstawie i lokalizacji pokazujemy trafne spotkania, grupy i osoby.' },
        { q: 'Mogę tworzyć zadania głosem?', a: 'Tak. Dotknij mikrofonu, opisz zadanie, a wyodrębnimy tytuł, opis, datę, osobę i lokalizację.' },
        { q: 'Czy moje dane są bezpieczne?', a: 'Absolutnie. Dane są szyfrowane, nigdy sprzedawane, a konto możesz usunąć w każdej chwili.' },
      ],
    },
    cta: {
      heading: 'Gotowy do działania?',
      sub: 'Dostępne na iOS i Android. Za darmo.',
    },
    store: { apple: 'App Store', google: 'Google Play', applePrefix: 'Pobierz z', googlePrefix: 'Pobierz z' },
    download: 'Pobierz',
    support: 'Wsparcie',
    privacy: 'Prywatność',
    terms: 'Regulamin',
    footer: '© 2026 Shuuty. Wszelkie prawa zastrzeżone.',
  },
} as const;

const STORE = {
  android: 'https://play.google.com/store/apps/details?id=com.shuuty&hl=en-US',
  ios: 'https://apps.apple.com/no/app/shuuty/id6670202422',
};

const SCREENSHOTS = [
  '/images/image1.webp',
  '/images/image2.webp',
  '/images/image3.webp',
];

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'pl', label: 'PL' },
];

/* ═══ SVG icons ═══ */

const FeatureIcon = ({ index }: { index: number }) => {
  const icons = [
    <svg key="tasks" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>,
    <svg key="meet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
    <svg key="groups" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
    <svg key="map" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  ];
  return icons[index] ?? null;
};

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={s.storeSvg}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" className={s.storeSvg}>
    <path fill="#4285F4" d="M12.954 11.616l2.957-2.957L6.36 3.291c-.344-.188-.71-.22-1.04-.1l7.634 8.425z" />
    <path fill="#34A853" d="M16.393 14.842l3.816-2.187c.6-.344.6-.903 0-1.247l-3.334-1.91-3.2 3.118 2.718 2.226z" />
    <path fill="#FBBC04" d="M5.32 3.19c-.381.22-.614.618-.614 1.15v15.386c0 .53.233.93.613 1.15l7.635-8.26L5.32 3.19z" />
    <path fill="#EA4335" d="M12.954 12.448l-7.634 8.26c.33.12.696.088 1.04-.1l9.551-5.366-2.957-2.794z" />
  </svg>
);

/* ═══ Store Button component ═══ */

const StoreButton = ({ platform, label, prefix, href }: { platform: 'apple' | 'google'; label: string; prefix: string; href: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={s.storeBtn}>
    {platform === 'apple' ? <AppleIcon /> : <PlayIcon />}
    <div className={s.storeBtnText}>
      <span className={s.storeBtnSmall}>{prefix}</span>
      <span className={s.storeBtnName}>{label}</span>
    </div>
  </a>
);

/* ═══ Component ═══ */

export default function Home() {
  const [lang, setLang] = useState<Lang>('en');
  const [ready, setReady] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    setReady(true);
    const saved = Cookies.get('lang') as Lang | undefined;
    if (saved === 'en' || saved === 'pl') setLang(saved);
  }, []);

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 40);
      const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 120;
      setShowMobileNav(window.scrollY > 500 && !atBottom);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const switchLang = useCallback((next: Lang) => {
    setLang(next);
    Cookies.set('lang', next, { expires: 365 });
  }, []);

  const toggleFaq = useCallback((i: number) => {
    setOpenFaq((prev) => (prev === i ? null : i));
  }, []);

  const c = t[lang];

  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    if (!ready) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(s.visible);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' },
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [ready]);

  const assignRef = (i: number) => (el: HTMLElement | null) => {
    sectionRefs.current[i] = el;
  };

  if (!ready) return null;

  return (
    <>
      <div className={s.noiseOverlay} aria-hidden />

      <div className={s.ambientWrap} aria-hidden>
        <div className={s.ambientGold} />
        <div className={s.ambientBlue} />
      </div>

      {/* ── Navbar ── */}
      <nav className={`${s.nav} ${scrolled ? s.navScrolled : ''}`}>
        <div className={s.navInner}>
          <a href="#" className={s.navLogo}>
            <Image src="/images/shuuty_icon.webp" alt="Shuuty" width={100} height={46} priority />
          </a>

          <div className={s.navLinks}>
            <a href="#features" className={s.navLink}>{c.nav.features}</a>
            <a href="#how" className={s.navLink}>{c.nav.how}</a>
            <a href="#download" className={s.navLink}>{c.nav.download}</a>
          </div>

          <div className={s.navRight}>
            <div className={s.langSwitch}>
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  className={`${s.langBtn} ${lang === l.code ? s.langActive : ''}`}
                  onClick={() => switchLang(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <a href="#download" className={s.navCta}>
              {c.download}
            </a>
          </div>
        </div>
      </nav>

      <main>
        {/* ══════════ HERO ══════════ */}
        <section className={s.hero}>
          <div className={s.heroContent}>
            <span className={s.heroBadge}>{c.hero.badge}</span>
            <h1 className={s.heroTitle}>
              {c.hero.h1_1}
              <br />
              <span className={s.heroGradient}>{c.hero.h1_2}</span>
            </h1>
            <p className={s.heroSub}>{c.hero.sub}</p>
            <div className={s.storeRow}>
              <StoreButton platform="apple" label={c.store.apple} prefix={c.store.applePrefix} href={STORE.ios} />
              <StoreButton platform="google" label={c.store.google} prefix={c.store.googlePrefix} href={STORE.android} />
            </div>
          </div>
          <div className={s.heroPhone}>
            <div className={s.phoneGlow} />
            <div className={s.phoneFrame}>
              <Image
                src="/images/image1.webp"
                alt="Shuuty app screenshot"
                width={340}
                height={680}
                priority
                className={s.phoneImg}
              />
            </div>
          </div>
        </section>

        <div className={s.divider} aria-hidden />

        {/* ══════════ FEATURES ══════════ */}
        <section id="features" className={s.section} ref={assignRef(0)}>
          <div className={s.sectionInner}>
            <div className={s.sectionHeader}>
              <span className={s.label}>{c.features.label}</span>
              <h2 className={s.sectionHeading}>{c.features.heading}</h2>
            </div>

            <div className={s.featGrid}>
              {c.features.items.map((f, i) => (
                <div key={i} className={s.featCard}>
                  <div className={s.featIconWrap}>
                    <FeatureIcon index={i} />
                  </div>
                  <h3 className={s.featTitle}>{f.title}</h3>
                  <p className={s.featDesc}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className={s.divider} aria-hidden />

        {/* ══════════ HOW IT WORKS ══════════ */}
        <section id="how" className={s.section} ref={assignRef(1)}>
          <div className={s.sectionInner}>
            <div className={s.sectionHeader}>
              <span className={s.label}>{c.how.label}</span>
              <h2 className={s.sectionHeading}>{c.how.heading}</h2>
            </div>

            <div className={s.stepsRow}>
              {c.how.steps.map((step, i) => (
                <div key={i} className={s.step}>
                  <span className={s.stepN}>{String(i + 1).padStart(2, '0')}</span>
                  <div className={s.stepLine} aria-hidden />
                  <h3 className={s.stepTitle}>{step.title}</h3>
                  <p className={s.stepDesc}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className={s.divider} aria-hidden />

        {/* ══════════ SHOWCASE ══════════ */}
        <section className={s.section} ref={assignRef(2)}>
          <div className={s.sectionInner}>
            <div className={s.sectionHeader}>
              <span className={s.label}>{c.showcase.label}</span>
            </div>

            {c.showcase.items.map((item, i) => (
              <div key={i} className={`${s.showcaseRow} ${i % 2 === 1 ? s.showcaseReverse : ''}`}>
                <div className={s.showcaseText}>
                  <span className={s.showcaseNum}>{String(i + 1).padStart(2, '0')}</span>
                  <h3 className={s.showcaseTitle}>{item.title}</h3>
                  <p className={s.showcaseDesc}>{item.desc}</p>
                </div>
                <div className={s.showcasePhone}>
                  <div className={s.showcasePhoneGlow} />
                  <Image
                    src={SCREENSHOTS[i]}
                    alt={item.title}
                    width={320}
                    height={640}
                    className={s.phoneImg}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className={s.divider} aria-hidden />

        {/* ══════════ FAQ ══════════ */}
        <section className={s.section} ref={assignRef(3)}>
          <div className={s.sectionInner}>
            <div className={s.faqLayout}>
              <div className={s.faqHeader}>
                <span className={s.label}>{c.faq.label}</span>
                <h2 className={s.sectionHeading}>{c.faq.heading}</h2>
              </div>
              <div className={s.faqList}>
                {c.faq.items.map((item, i) => (
                  <div key={i} className={`${s.faqItem} ${openFaq === i ? s.faqOpen : ''}`}>
                    <button className={s.faqQ} onClick={() => toggleFaq(i)}>
                      <span>{item.q}</span>
                      <span className={s.faqChevron}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                    <div className={s.faqA}>
                      <p>{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ CTA ══════════ */}
        <section id="download" className={s.cta} ref={assignRef(4)}>
          <div className={s.ctaGlow} aria-hidden />
          <h2 className={s.ctaHeading}>
            <span className={s.heroGradient}>{c.cta.heading}</span>
          </h2>
          <p className={s.ctaSub}>{c.cta.sub}</p>
          <div className={s.storeRow}>
            <StoreButton platform="apple" label={c.store.apple} prefix={c.store.applePrefix} href={STORE.ios} />
            <StoreButton platform="google" label={c.store.google} prefix={c.store.googlePrefix} href={STORE.android} />
          </div>
        </section>
      </main>

      {/* ══════════ FOOTER ══════════ */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerLeft}>
            <Image src="/images/shuuty_icon.webp" alt="" width={72} height={34} className={s.footerIcon} />
            <span className={s.footerCopy}>{c.footer}</span>
          </div>
          <nav className={s.footerLinks}>
            <Link href="/support">{c.support}</Link>
            <Link href="/privacy">{c.privacy}</Link>
            <Link href="/terms">{c.terms}</Link>
          </nav>
        </div>
      </footer>

      {/* ── Mobile floating nav ── */}
      <div className={`${s.mobileNav} ${showMobileNav ? s.mobileNavVisible : ''}`}>
        <a href="#features" className={s.mobileNavItem} aria-label={c.nav.features}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
        </a>
        <a href="#how" className={s.mobileNavItem} aria-label={c.nav.how}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        </a>
        <a href="#download" className={s.mobileNavCta} aria-label={c.download}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
        </a>
      </div>
    </>
  );
}
