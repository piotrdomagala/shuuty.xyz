'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { DocumentLanguage } from '@/components/documentLocale';
import TaskSpatialHandoff from '@/components/TaskSpatialHandoff';
import { useSiteLanguage } from '@/components/useSiteLanguage';
import { getProductMediaPlacements } from '@/lib/productMedia';
import { SITE_URL, SOCIAL_IMAGE } from '@/lib/site';
import s from '@/app/page.module.css';
import t from '@/app/homeContent.json';

type Lang = DocumentLanguage;
type Theme = 'light' | 'dark';
type IconName =
  | 'arrow'
  | 'calendar'
  | 'check'
  | 'clock'
  | 'community'
  | 'download'
  | 'group'
  | 'map'
  | 'mic'
  | 'moon'
  | 'offer'
  | 'people'
  | 'private'
  | 'reminder'
  | 'send'
  | 'sun'
  | 'task'
  | 'work';

const STORE = {
  android: 'https://play.google.com/store/apps/details?id=com.shuuty.app',
  ios: 'https://apps.apple.com/app/shuuty/id6670202422',
};

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'pl', label: 'PL' },
];

const localizedPath = (language: Lang, path: string) =>
  language === 'pl' ? `/pl${path}` : path;

const createSiteSchema = (language: Lang, copy: (typeof t)[Lang]) => {
  const pageUrl = language === 'pl' ? `${SITE_URL}/pl/` : `${SITE_URL}/`;
  const productMediaPlacements = getProductMediaPlacements(language);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: 'Shuuty',
        alternateName: 'Shuuty App',
        inLanguage: ['en', 'pl'],
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Shuuty',
        legalName: 'Shuuty Prosta Spółka Akcyjna',
        url: `${SITE_URL}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
        },
        email: 'shuuty.app@gmail.com',
      },
      {
        '@type': ['SoftwareApplication', 'MobileApplication'],
        '@id': `${SITE_URL}/#mobile-app`,
        name: 'Shuuty',
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'iOS, Android',
        url: `${SITE_URL}/`,
        image: SOCIAL_IMAGE.url,
        downloadUrl: [STORE.ios, STORE.android],
        sameAs: [STORE.ios, STORE.android],
        screenshot: productMediaPlacements.hero.map(
          (media) => `${SITE_URL}${media.path}`,
        ),
        description: copy.hero.sub,
        publisher: { '@id': `${SITE_URL}/#organization` },
        offers: {
          '@type': 'Offer',
          price: 0,
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name:
          language === 'pl'
            ? 'Shuuty - od pomysłu do działania'
            : 'Shuuty - From idea to action',
        description: copy.hero.sub,
        inLanguage: language,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#mobile-app` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        url: `${pageUrl}#faq`,
        inLanguage: language,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        mainEntity: copy.faq.items.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ],
  };
};

function Icon({ name }: Readonly<{ name: IconName }>) {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'arrow':
      return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case 'calendar':
      return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4m8-4v4M3 10h18" /></svg>;
    case 'check':
      return <svg {...props}><path d="m5 12 4 4L19 6" /></svg>;
    case 'clock':
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case 'community':
      return <svg {...props}><circle cx="8" cy="9" r="3" /><circle cx="17" cy="8" r="2" /><path d="M2.5 19c.7-3.2 2.7-5 5.5-5s4.8 1.8 5.5 5M14 13c3.7-.4 6.1 1.5 6.8 4.5" /></svg>;
    case 'download':
      return <svg {...props}><path d="M12 3v12m-5-5 5 5 5-5M5 21h14" /></svg>;
    case 'group':
      return <svg {...props}><circle cx="9" cy="8" r="3.2" /><path d="M3 19c.6-3.7 2.7-5.6 6-5.6s5.4 1.9 6 5.6M15.5 5.5a3 3 0 0 1 0 5.8M16.5 14c2.5.3 4 1.9 4.5 4.5" /></svg>;
    case 'map':
      return <svg {...props}><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z" /><path d="M8 3v15m8-12v15" /></svg>;
    case 'mic':
      return <svg {...props}><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21m-4 0h8" /></svg>;
    case 'moon':
      return <svg {...props}><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" /></svg>;
    case 'offer':
      return <svg {...props}><path d="M20 13 13 20l-9-9V4h7l9 9Z" /><circle cx="8.5" cy="8.5" r="1.5" /></svg>;
    case 'people':
      return <svg {...props}><circle cx="8" cy="8" r="3" /><circle cx="17" cy="8.5" r="2.5" /><path d="M2.5 19c.6-3.6 2.5-5.5 5.5-5.5s4.9 1.9 5.5 5.5M14 14c3.7-.7 6.2 1 7 4.5" /></svg>;
    case 'private':
      return <svg {...props}><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>;
    case 'reminder':
      return <svg {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /><path d="M18.5 3.5 20 2m-14.5 1.5L4 2" /></svg>;
    case 'send':
      return <svg {...props}><path d="m3 11 18-8-8 18-2.5-7.5L3 11Z" /><path d="M10.5 13.5 21 3" /></svg>;
    case 'sun':
      return <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
    case 'task':
      return <svg {...props}><rect x="4" y="3" width="16" height="18" rx="3" /><path d="m8 9 1.5 1.5L12 8m-4 7 1.5 1.5L12 14m2-5h2m-2 6h2" /></svg>;
    case 'work':
      return <svg {...props}><rect x="3" y="7" width="18" height="13" rx="3" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2" /></svg>;
  }
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={s.storeSvg} aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.storeSvg} aria-hidden>
      <path fill="#4285F4" d="m13 11.6 3-3-9.6-5.3c-.3-.2-.7-.2-1-.1l7.6 8.4Z" />
      <path fill="#34A853" d="m16.4 14.8 3.8-2.2c.6-.3.6-.9 0-1.2l-3.3-1.9-3.2 3.1 2.7 2.2Z" />
      <path fill="#FBBC04" d="M5.3 3.2c-.4.2-.6.6-.6 1.1v15.4c0 .5.2.9.6 1.2l7.7-8.3-7.7-9.4Z" />
      <path fill="#EA4335" d="m13 12.4-7.7 8.3c.4.1.8.1 1.1-.1l9.5-5.4-2.9-2.8Z" />
    </svg>
  );
}

function StoreButton({
  platform,
  label,
  prefix,
  href,
}: Readonly<{
  platform: 'apple' | 'google';
  label: string;
  prefix: string;
  href: string;
}>) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={s.storeBtn}>
      {platform === 'apple' ? <AppleIcon /> : <PlayIcon />}
      <span className={s.storeBtnText}>
        <span className={s.storeBtnSmall}>{prefix}</span>
        <span className={s.storeBtnName}>{label}</span>
      </span>
    </a>
  );
}

function StoreButtons({ copy }: Readonly<{ copy: (typeof t)['en']['store'] | (typeof t)['pl']['store'] }>) {
  return (
    <div className={s.storeRow}>
      <StoreButton platform="apple" label={copy.apple} prefix={copy.applePrefix} href={STORE.ios} />
      <StoreButton platform="google" label={copy.google} prefix={copy.googlePrefix} href={STORE.android} />
    </div>
  );
}

export default function HomePageClient({ initialLanguage }: { initialLanguage: Lang }) {
  const { language: lang, changeLanguage: switchLang } = useSiteLanguage(initialLanguage);
  const [theme, setTheme] = useState<Theme>('dark');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [activeHeroPhone, setActiveHeroPhone] = useState(0);
  const carouselPointerStart = useRef<number | null>(null);
  const carouselDidSwipe = useRef(false);
  const lastScrollY = useRef(0);
  const mobileNavScrollDelta = useRef(0);
  const mobileNavHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const c = t[lang];
  const productMediaPlacements = getProductMediaPlacements(lang);

  const mediaAlt = (media: { altKey: string }) =>
    c.images[media.altKey as keyof typeof c.images];

  const heroPhones = productMediaPlacements.hero.map((media, index) => ({
    ...media,
    alt: mediaAlt(media),
    priority: index === 0,
  }));
  const taskFlowScreens = [
    productMediaPlacements.voiceInput,
    productMediaPlacements.assignee,
    productMediaPlacements.delegatedTask,
  ].map((media) => ({
    ...media,
    alt: mediaAlt(media),
  }));

  const selectHeroPhone = useCallback((index: number) => {
    setActiveHeroPhone((index + 3) % 3);
  }, []);

  const rotateHeroPhones = useCallback((direction: -1 | 1) => {
    setActiveHeroPhone((current) => (current + direction + 3) % 3);
  }, []);

  const handleCarouselKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        rotateHeroPhones(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        rotateHeroPhones(1);
      }
    },
    [rotateHeroPhones],
  );

  const handleCarouselPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' || !event.isPrimary) {
      carouselPointerStart.current = null;
      return;
    }

    carouselDidSwipe.current = false;
    carouselPointerStart.current = event.clientX;
  }, []);

  const handleCarouselPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!event.isPrimary) {
        carouselPointerStart.current = null;
        return;
      }

      const start = carouselPointerStart.current;
      carouselPointerStart.current = null;
      if (start === null) return;

      const distance = event.clientX - start;
      if (Math.abs(distance) >= 36) {
        carouselDidSwipe.current = true;
        rotateHeroPhones(distance > 0 ? -1 : 1);
        window.setTimeout(() => {
          carouselDidSwipe.current = false;
        }, 500);
      }
    },
    [rotateHeroPhones],
  );

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === 'light' ? 'light' : 'dark');
  }, []);

  useEffect(() => {
    const clearMobileNavTimer = () => {
      if (!mobileNavHideTimer.current) return;
      clearTimeout(mobileNavHideTimer.current);
      mobileNavHideTimer.current = null;
    };

    const handler = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;
      const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 160;
      const changedDirection =
        (scrollDelta > 0 && mobileNavScrollDelta.current < 0)
        || (scrollDelta < 0 && mobileNavScrollDelta.current > 0);
      mobileNavScrollDelta.current = changedDirection
        ? scrollDelta
        : mobileNavScrollDelta.current + scrollDelta;

      if (currentScrollY <= 640 || atBottom || mobileNavScrollDelta.current > 8) {
        setShowMobileNav(false);
        mobileNavScrollDelta.current = 0;
        clearMobileNavTimer();
      } else if (mobileNavScrollDelta.current < -8) {
        setShowMobileNav(true);
        mobileNavScrollDelta.current = 0;
        clearMobileNavTimer();
        mobileNavHideTimer.current = setTimeout(() => {
          setShowMobileNav(false);
          mobileNavHideTimer.current = null;
        }, 1200);
      }

      lastScrollY.current = currentScrollY;
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => {
      window.removeEventListener('scroll', handler);
      clearMobileNavTimer();
    };
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window)) {
      sections.forEach((section) => section.classList.add(s.visible));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(s.visible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -48px 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next;
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
        meta.content = next === 'light' ? '#FFFBF5' : '#0D1117';
      });
      try {
        window.localStorage.setItem('shuuty-theme', next);
      } catch {
        // The selected theme still applies when storage is unavailable.
      }
      return next;
    });
  }, []);

  return (
    <div lang={lang}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(createSiteSchema(lang, c)) }}
      />
      <a href="#main" className={s.skipLink}>{c.a11y.skip}</a>
      <div className={s.noiseOverlay} aria-hidden />
      <div className={s.ambient} aria-hidden>
        <span className={s.ambientWarm} />
        <span className={s.ambientCool} />
      </div>

      <header className={s.header}>
        <nav className={s.nav} aria-label={c.a11y.mainNav}>
          <a href="#top" className={s.brand} aria-label="Shuuty">
            <span className={s.brandMark} aria-hidden="true">
              <Image src="/images/brand/shuuty-app-icon.png" alt="" width={40} height={40} priority />
            </span>
            <span className={s.brandName}>Shuuty</span>
          </a>

          <div className={s.navLinks}>
            <a href="#overview">{c.nav.overview}</a>
            <a href="#tasks">{c.nav.tasks}</a>
            <a href="#groups">{c.nav.groups}</a>
            <a href="#discover">{c.nav.discover}</a>
          </div>

          <div className={s.navActions}>
            <button
              type="button"
              className={s.themeBtn}
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? c.a11y.themeToLight : c.a11y.themeToDark}
              title={theme === 'dark' ? c.a11y.themeToLight : c.a11y.themeToDark}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <fieldset className={s.langSwitch}>
              <legend className={s.srOnly}>{c.a11y.language}</legend>
              {LANGS.map((item) => (
                <button
                  type="button"
                  key={item.code}
                  className={`${s.langBtn} ${lang === item.code ? s.langActive : ''}`}
                  onClick={() => switchLang(item.code)}
                  aria-pressed={lang === item.code}
                >
                  {item.label}
                </button>
              ))}
            </fieldset>
            <a href="#download" className={s.navCta}>{c.nav.download}</a>
          </div>
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
        <section id="top" className={s.hero}>
          <div className={s.heroCopy}>
            <span className={s.eyebrow}><span className={s.statusDot} />{c.hero.badge}</span>
            <h1 className={s.heroTitle}>
              {c.hero.title}
              <br />
              <span className={s.gradientText}>{c.hero.accent}</span>
            </h1>
            <p className={s.relayLine}>{c.hero.relay}</p>
            <p className={s.heroLead}>{c.hero.sub}</p>
            <div className={s.heroActions}>
              <StoreButtons copy={c.store} />
              <a href="#overview" className={s.textCta}>
                {c.hero.secondaryCta}<Icon name="arrow" />
              </a>
            </div>
            <ul className={s.signalList}>
              {c.hero.signals.map((signal) => <li key={signal}><Icon name="check" />{signal}</li>)}
            </ul>
          </div>

          <div
            className={s.heroVisual}
            role="region"
            aria-roledescription={lang === 'pl' ? 'karuzela' : 'carousel'}
            aria-label={lang === 'pl' ? 'Podglądy aplikacji Shuuty' : 'Shuuty app previews'}
            onKeyDown={handleCarouselKeyDown}
            onPointerDown={handleCarouselPointerDown}
            onPointerUp={handleCarouselPointerUp}
            onPointerCancel={() => {
              carouselPointerStart.current = null;
              carouselDidSwipe.current = false;
            }}
          >
            {heroPhones.map((phone, index) => {
              const offset = (index - activeHeroPhone + heroPhones.length) % heroPhones.length;
              const positionClass = offset === 0
                ? s.phoneMain
                : offset === 1
                  ? s.phoneBackRight
                  : s.phoneBackLeft;
              const isActive = offset === 0;

              return (
                <button
                  type="button"
                  key={phone.id}
                  className={`${s.phone} ${positionClass}`}
                  onClick={() => {
                    if (carouselDidSwipe.current) {
                      carouselDidSwipe.current = false;
                      return;
                    }
                    selectHeroPhone(index);
                  }}
                  aria-label={`${phone.alt}. ${
                    isActive
                      ? (lang === 'pl' ? 'Widok aktywny' : 'Active view')
                      : (lang === 'pl' ? 'Pokaż na pierwszym planie' : 'Bring to front')
                  }`}
                  aria-pressed={isActive}
                >
                  <Image
                    src={phone.path}
                    alt={phone.alt}
                    width={phone.width}
                    height={phone.height}
                    priority={phone.priority}
                    draggable={false}
                    sizes={isActive ? '(max-width: 720px) 55vw, 290px' : '(max-width: 720px) 34vw, 190px'}
                  />
                </button>
              );
            })}
            <div
              className={s.carouselDots}
              role="group"
              aria-label={lang === 'pl' ? 'Wybierz podgląd' : 'Choose a preview'}
            >
              {heroPhones.map((phone, index) => (
                <button
                  type="button"
                  key={`${phone.id}-dot`}
                  className={`${s.carouselDot} ${index === activeHeroPhone ? s.carouselDotActive : ''}`}
                  onClick={() => {
                    if (carouselDidSwipe.current) {
                      carouselDidSwipe.current = false;
                      return;
                    }
                    selectHeroPhone(index);
                  }}
                  aria-label={`${lang === 'pl' ? 'Podgląd' : 'Preview'} ${index + 1}: ${phone.alt}`}
                  aria-pressed={index === activeHeroPhone}
                />
              ))}
            </div>
            <p className={s.srOnly} aria-live="polite">
              {`${activeHeroPhone + 1} / ${heroPhones.length}: ${heroPhones[activeHeroPhone].alt}`}
            </p>
          </div>
        </section>

        <section id="overview" className={`${s.section} ${s.reveal}`} data-reveal>
          <div className={s.container}>
            <div className={s.sectionIntro}>
              <span className={s.sectionLabel}>{c.overview.label}</span>
              <h2>{c.overview.heading}</h2>
              <p>{c.overview.lead}</p>
            </div>
            <div className={s.pillarGrid}>
              {c.overview.items.map((item) => (
                <a key={item.kicker} href={item.href} className={s.pillarCard}>
                  <span className={s.pillarTop}><span>{item.kicker}</span><Icon name={item.icon as IconName} /></span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <span className={s.cardArrow}><Icon name="arrow" /></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="tasks" className={`${s.chapter} ${s.taskChapter} ${s.reveal}`} data-reveal>
          <div className={s.container}>
            <div className={s.taskIntro}>
              <div>
                <span className={s.sectionLabel}>{c.tasks.label}</span>
                <h2>{c.tasks.heading}</h2>
              </div>
              <div className={s.taskIntroLead}>
                <span>{c.tasks.mechanismLabel}</span>
                <p>{c.tasks.lead}</p>
                <p>{c.tasks.mechanismLead}</p>
              </div>
            </div>

            <TaskSpatialHandoff
              regionLabel={c.tasks.flowRegionLabel}
              selectLabel={c.tasks.flowSelectLabel}
              screens={taskFlowScreens}
              steps={c.tasks.mechanism}
            />

            <ul className={s.taskDepthList}>
              {c.tasks.bullets.map((bullet, index) => (
                <li key={bullet}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{bullet}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="groups" className={`${s.chapter} ${s.chapterTint} ${s.reveal}`} data-reveal>
          <div className={`${s.container} ${s.chapterGrid} ${s.reverseGrid}`}>
            <div className={s.groupsVisual}>
              <div className={s.groupScreenPair}>
                <figure className={s.groupGalleryScreen}>
                  <Image
                    src={productMediaPlacements.groupGallery.path}
                    alt=""
                    width={productMediaPlacements.groupGallery.width}
                    height={productMediaPlacements.groupGallery.height}
                    sizes="(max-width: 720px) 58vw, (max-width: 960px) 370px, 330px"
                  />
                  <figcaption>{mediaAlt(productMediaPlacements.groupGallery)}</figcaption>
                </figure>
                <figure className={s.groupListScreen}>
                  <Image
                    src={productMediaPlacements.groups.path}
                    alt=""
                    width={productMediaPlacements.groups.width}
                    height={productMediaPlacements.groups.height}
                    sizes="(max-width: 720px) 34vw, (max-width: 960px) 210px, 190px"
                  />
                  <figcaption>{mediaAlt(productMediaPlacements.groups)}</figcaption>
                </figure>
              </div>
              <div className={s.groupModeRail}>
                <span className={s.modesLabel}>{c.groups.modesLabel}</span>
                <ol className={s.groupModeGrid}>
                  {c.groups.modes.map((mode, index) => (
                    <li key={mode.title} className={s.groupModeItem}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <div><strong>{mode.title}</strong><p>{mode.desc}</p></div>
                    </li>
                  ))}
                </ol>
                <p className={s.groupModuleLine}>
                  <strong>{c.groups.modulesLabel}</strong>{' '}
                  {c.groups.modules.join(' · ')}
                </p>
              </div>
            </div>
            <div className={s.chapterCopy}>
              <span className={s.sectionLabel}>{c.groups.label}</span>
              <h2>{c.groups.heading}</h2>
              <p className={s.chapterLead}>{c.groups.lead}</p>
              <ul className={s.bulletList}>
                {c.groups.bullets.map((bullet) => <li key={bullet}><span><Icon name="check" /></span>{bullet}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section id="discover" className={`${s.chapter} ${s.reveal}`} data-reveal>
          <div className={`${s.container} ${s.chapterGrid}`}>
            <div className={s.chapterCopy}>
              <span className={s.sectionLabel}>{c.discover.label}</span>
              <h2>{c.discover.heading}</h2>
              <p className={s.chapterLead}>{c.discover.lead}</p>
              <ul className={s.bulletList}>
                {c.discover.bullets.map((bullet) => <li key={bullet}><span><Icon name="check" /></span>{bullet}</li>)}
              </ul>
              <article className={s.mapStory}>
                <span className={s.mapStoryLabel}><Icon name="map" />{c.discover.map.label}</span>
                <h3>{c.discover.map.heading}</h3>
                <p>{c.discover.map.lead}</p>
                <ul>
                  {c.discover.map.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              </article>
            </div>
            <div className={s.mapVisual}>
              <div className={s.mapCaption}><span><Icon name="map" /></span>{c.discover.mapCaption}</div>
              <figure className={s.mapPhoneLeft}>
                <div className={s.mapPhoneFrame}>
                  <Image
                    src={productMediaPlacements.bookings.path}
                    alt={mediaAlt(productMediaPlacements.bookings)}
                    width={productMediaPlacements.bookings.width}
                    height={productMediaPlacements.bookings.height}
                    sizes="(max-width: 720px) 48vw, 250px"
                  />
                </div>
                <figcaption>{mediaAlt(productMediaPlacements.bookings)}</figcaption>
              </figure>
              <figure className={s.mapPhoneRight}>
                <div className={s.mapPhoneFrame}>
                  <Image
                    src={productMediaPlacements.nearby.path}
                    alt={mediaAlt(productMediaPlacements.nearby)}
                    width={productMediaPlacements.nearby.width}
                    height={productMediaPlacements.nearby.height}
                    sizes="(max-width: 720px) 48vw, 250px"
                  />
                </div>
                <figcaption>{mediaAlt(productMediaPlacements.nearby)}</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="experience" className={`${s.chapter} ${s.chapterTint} ${s.reveal}`} data-reveal>
          <div className={`${s.container} ${s.experienceGrid}`}>
            <figure className={s.experienceVisual}>
              <div className={s.experienceScreens}>
                <div className={`${s.phone} ${s.experienceDevice} ${s.experienceTabletPrimary}`}>
                  <Image
                    src={productMediaPlacements.groupGallery.path}
                    alt={mediaAlt(productMediaPlacements.groupGallery)}
                    width={productMediaPlacements.groupGallery.width}
                    height={productMediaPlacements.groupGallery.height}
                    sizes="(max-width: 720px) 72vw, 390px"
                  />
                </div>
                <div className={`${s.phone} ${s.experienceDevice} ${s.experiencePhoneSecondary}`}>
                  <Image
                    src={productMediaPlacements.modules.path}
                    alt={mediaAlt(productMediaPlacements.modules)}
                    width={productMediaPlacements.modules.width}
                    height={productMediaPlacements.modules.height}
                    sizes="(max-width: 720px) 45vw, 215px"
                  />
                </div>
              </div>
              <figcaption>
                {c.experience.screenCaption}: {mediaAlt(productMediaPlacements.groupGallery)};{' '}
                {mediaAlt(productMediaPlacements.modules)}
              </figcaption>
            </figure>
            <div className={s.chapterCopy}>
              <span className={s.sectionLabel}>{c.experience.label}</span>
              <h2>{c.experience.heading}</h2>
              <p className={s.chapterLead}>{c.experience.lead}</p>
              <div className={s.experienceList}>
                {c.experience.items.map((item, index) => (
                  <article key={item.title}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div><h3>{item.title}</h3><p>{item.desc}</p></div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.flowSection} ${s.reveal}`} data-reveal>
          <div className={s.container}>
            <div className={s.sectionIntro}>
              <span className={s.sectionLabel}>{c.flow.label}</span>
              <h2>{c.flow.heading}</h2>
              <p>{c.flow.lead}</p>
            </div>
            <div className={s.flowGrid}>
              {c.flow.items.map((item, index) => (
                <div key={item.title} className={s.flowCard}>
                  <span className={s.flowNumber}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={s.flowIcon}><Icon name={item.icon as IconName} /></span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  {index < c.flow.items.length - 1 && <span className={s.flowArrow}><Icon name="arrow" /></span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className={`${s.section} ${s.faqSection} ${s.reveal}`} data-reveal>
          <div className={`${s.container} ${s.faqLayout}`}>
            <div className={s.faqIntro}>
              <span className={s.sectionLabel}>{c.faq.label}</span>
              <h2>{c.faq.heading}</h2>
            </div>
            <div className={s.faqList}>
              {c.faq.items.map((item, index) => (
                  <details key={item.q} className={s.faqItem} open={index === 0}>
                    <summary className={s.faqQuestion}>
                      <span>{item.q}</span>
                      <i aria-hidden />
                    </summary>
                    <div className={s.faqAnswer}>
                      <p>{item.a}</p>
                    </div>
                  </details>
              ))}
            </div>
          </div>
        </section>

        <section id="download" className={`${s.cta} ${s.reveal}`} data-reveal>
          <div className={s.ctaGlow} aria-hidden />
          <div className={s.ctaInner}>
            <span className={s.sectionLabel}>{c.cta.eyebrow}</span>
            <h2>{c.cta.heading}</h2>
            <p>{c.cta.sub}</p>
            <StoreButtons copy={c.store} />
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerBrand}>
            <span className={s.brandMark} aria-hidden="true">
              <Image src="/images/brand/shuuty-app-icon.png" alt="" width={34} height={34} />
            </span>
            <div><strong>SHUUTY</strong><span>{c.footer.tagline}</span></div>
          </div>
          <span className={s.footerCopy}>{c.footer.copyright}</span>
          <nav className={s.footerLinks} aria-label={c.a11y.footerNav}>
            <Link href={localizedPath(lang, '/support/')}>{c.footer.support}</Link>
            <Link href={localizedPath(lang, '/privacy/')}>{c.footer.privacy}</Link>
            <Link href={localizedPath(lang, '/terms/')}>{c.footer.terms}</Link>
          </nav>
        </div>
      </footer>

      <nav className={`${s.mobileNav} ${showMobileNav ? s.mobileNavVisible : ''}`} aria-label={c.a11y.mainNav}>
        <a href="#tasks" aria-label={c.nav.tasks}><Icon name="task" /></a>
        <a href="#groups" aria-label={c.nav.groups}><Icon name="group" /></a>
        <a href="#discover" aria-label={c.nav.discover}><Icon name="map" /></a>
        <a href="#download" className={s.mobileDownload} aria-label={c.nav.download}><Icon name="download" /></a>
      </nav>
    </div>
  );
}
