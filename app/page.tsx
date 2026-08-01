'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { DocumentLanguage } from '@/components/documentLocale';
import { useSiteLanguage } from '@/components/useSiteLanguage';
import { SITE_URL, SOCIAL_IMAGE } from '@/lib/site';
import s from './page.module.css';
import t from './homeContent.json';

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

const TASK_META_ICONS = ['clock', 'people', 'reminder'] as const;

const SITE_SCHEMA = {
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
      screenshot: [
        `${SITE_URL}/images/app/create-menu.png`,
        `${SITE_URL}/images/app/discover-groups.png`,
        `${SITE_URL}/images/app/discover-meetings.png`,
      ],
      description:
        'Shuuty connects voice-created tasks, immediate delegation, flexible groups, meetings and nearby discovery in one mobile app.',
      publisher: { '@id': `${SITE_URL}/#organization` },
      offers: {
        '@type': 'Offer',
        price: 0,
        priceCurrency: 'USD',
      },
    },
  ],
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

export default function Home() {
  const { language: lang, changeLanguage: switchLang } = useSiteLanguage();
  const [theme, setTheme] = useState<Theme>('dark');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const c = t[lang];

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === 'light' ? 'light' : 'dark');
  }, []);

  useEffect(() => {
    const handler = () => {
      const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 160;
      setShowMobileNav(window.scrollY > 640 && !atBottom);
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_SCHEMA) }}
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

          <div className={s.heroVisual}>
            <div className={`${s.phone} ${s.phoneBackLeft}`}>
              <Image src="/images/app/profile-settings.png" alt={c.images.settings} width={471} height={1024} sizes="(max-width: 720px) 30vw, 190px" />
            </div>
            <div className={`${s.phone} ${s.phoneMain}`}>
              <Image src="/images/app/create-menu.png" alt={c.images.create} width={471} height={1024} priority sizes="(max-width: 720px) 52vw, 290px" />
              <span className={s.phoneHighlight}><Icon name="mic" />{c.hero.voice}</span>
            </div>
            <div className={`${s.phone} ${s.phoneBackRight}`}>
              <Image src="/images/app/discover-groups.png" alt={c.images.groups} width={471} height={1024} sizes="(max-width: 720px) 30vw, 190px" />
            </div>
            <span className={`${s.orbitBadge} ${s.orbitTask}`}><Icon name="task" />{c.nav.tasks}</span>
            <span className={`${s.orbitBadge} ${s.orbitGroup}`}><Icon name="group" />{c.nav.groups}</span>
            <span className={`${s.orbitBadge} ${s.orbitMap}`}><Icon name="map" />{c.discover.meetings}</span>
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

        <section id="tasks" className={`${s.chapter} ${s.reveal}`} data-reveal>
          <div className={`${s.container} ${s.chapterGrid}`}>
            <div className={s.chapterCopy}>
              <span className={s.sectionLabel}>{c.tasks.label}</span>
              <h2>{c.tasks.heading}</h2>
              <p className={s.chapterLead}>{c.tasks.lead}</p>
              <ul className={s.bulletList}>
                {c.tasks.bullets.map((bullet) => <li key={bullet}><span><Icon name="check" /></span>{bullet}</li>)}
              </ul>
            </div>

            <div className={s.productCanvas}>
              <div className={s.canvasGlow} aria-hidden />
              <div className={s.voiceDemo}>
                <div className={s.demoHeader}>
                  <span className={s.demoIcon}><Icon name="mic" /></span>
                  <span>{c.tasks.voiceLabel}</span>
                  <span className={s.livePill}><i />AI</span>
                </div>
                <blockquote>{c.tasks.voicePrompt}</blockquote>
                <div className={s.voiceWave} aria-hidden>{[10, 18, 12, 28, 20, 34, 14, 24, 11, 20, 8].map((height, index) => <i key={index} style={{ height }} />)}</div>
                <div className={s.parsedTask}>
                  <span className={s.parsedLabel}>{c.tasks.parsedLabel}</span>
                  <div className={s.parsedTitle}><span className={s.taskCheck}><Icon name="task" /></span><strong>{c.tasks.parsedTitle}</strong></div>
                  <div className={s.metaChips}>
                    {c.tasks.parsedMeta.map((meta, index) => (
                      <span key={meta}><Icon name={TASK_META_ICONS[index] ?? 'reminder'} />{meta}</span>
                    ))}
                  </div>
                  <span className={s.delegateDemo}><Icon name="send" />{c.tasks.delegate}</span>
                  <p className={s.deliveryNote}>{c.tasks.deliveryNote}</p>
                </div>
              </div>
              <ol className={s.miniFlow}>
                {c.tasks.flow.map((step, index) => (
                  <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="groups" className={`${s.chapter} ${s.chapterTint} ${s.reveal}`} data-reveal>
          <div className={`${s.container} ${s.chapterGrid} ${s.reverseGrid}`}>
            <div className={s.groupsVisual}>
              <div className={`${s.phone} ${s.groupPhone}`}>
                <Image src="/images/app/discover-groups.png" alt={c.images.groups} width={471} height={1024} sizes="(max-width: 960px) 230px, 270px" />
              </div>
              <div className={s.groupModes}>
                <span className={s.modesLabel}>{c.groups.modesLabel}</span>
                {c.groups.modes.map((mode) => (
                  <div key={mode.title} className={s.groupModeCard}>
                    <span><Icon name={mode.icon as IconName} /></span>
                    <div><strong>{mode.title}</strong><p>{mode.desc}</p></div>
                  </div>
                ))}
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
              <figure className={`${s.phone} ${s.mapPhoneLeft}`}>
                <Image src="/images/app/discover-meetings.png" alt={c.images.meetings} width={471} height={1024} sizes="(max-width: 720px) 48vw, 250px" />
                <figcaption>{c.discover.meetings}</figcaption>
              </figure>
              <figure className={`${s.phone} ${s.mapPhoneRight}`}>
                <Image src="/images/app/discover-groups.png" alt={c.images.groups} width={471} height={1024} sizes="(max-width: 720px) 48vw, 250px" />
                <figcaption>{c.discover.groups}</figcaption>
              </figure>
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

        <section className={`${s.section} ${s.faqSection} ${s.reveal}`} data-reveal>
          <div className={`${s.container} ${s.faqLayout}`}>
            <div className={s.faqIntro}>
              <span className={s.sectionLabel}>{c.faq.label}</span>
              <h2>{c.faq.heading}</h2>
            </div>
            <div className={s.faqList}>
              {c.faq.items.map((item, index) => {
                const isOpen = openFaq === index;
                const panelId = `faq-panel-${index}`;
                return (
                  <div key={item.q} className={`${s.faqItem} ${isOpen ? s.faqOpen : ''}`}>
                    <button
                      type="button"
                      className={s.faqQuestion}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                    >
                      <span>{item.q}</span>
                      <i aria-hidden>{isOpen ? '−' : '+'}</i>
                    </button>
                    <div id={panelId} className={s.faqAnswer} aria-hidden={!isOpen}>
                      <p>{item.a}</p>
                    </div>
                  </div>
                );
              })}
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
            <Link href="/support/">{c.footer.support}</Link>
            <Link href="/privacy/">{c.footer.privacy}</Link>
            <Link href="/terms/">{c.footer.terms}</Link>
          </nav>
        </div>
      </footer>

      <nav className={`${s.mobileNav} ${showMobileNav ? s.mobileNavVisible : ''}`} aria-label={c.a11y.mainNav}>
        <a href="#tasks" aria-label={c.nav.tasks}><Icon name="task" /></a>
        <a href="#groups" aria-label={c.nav.groups}><Icon name="group" /></a>
        <a href="#discover" aria-label={c.nav.discover}><Icon name="map" /></a>
        <a href="#download" className={s.mobileDownload} aria-label={c.nav.download}><Icon name="download" /></a>
      </nav>
    </>
  );
}
