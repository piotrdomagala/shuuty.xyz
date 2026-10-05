'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { localizedSitePath, type SiteLanguage } from '@/components/documentLocale';
import LanguageMenu from '@/components/LanguageMenu';
import HeroSmoke from '@/components/HeroSmoke';
import ProductDeviceFrame from '@/components/ProductDeviceFrame';
import { useSiteLanguage } from '@/components/useSiteLanguage';
import guidesContent from '@/content/guides.json';
import { asGuides, guidePath, guidesIn, type GuideEntry } from '@/lib/guides.mjs';
import { getProductMediaPlacement, type ProductMediaPlacement } from '@/lib/productMedia';
import {
  APP_STORE_DEVELOPER_URL,
  APP_STORE_URL,
  createStoreLinks,
  GOOGLE_PLAY_DEVELOPER_URL,
  GOOGLE_PLAY_URL,
  SITE_URL,
  socialImage,
} from '@/lib/site';
import s from '@/app/page.module.css';
import t from '@/app/homeContent.json';

type Lang = SiteLanguage;
type Theme = 'light' | 'dark';
type Copy = (typeof t)[Lang];
type GuideTopic = keyof Copy['guideLabels'];
type IconName =
  | 'arrow'
  | 'book'
  | 'calendar'
  | 'check'
  | 'community'
  | 'download'
  | 'group'
  | 'map'
  | 'moon'
  | 'people'
  | 'sun'
  | 'task'
  | 'work';

type StorePlacement = 'hero' | 'download';
type ScreenCopy = Readonly<{ media: string; alt: string }>;
type Screen = ProductMediaPlacement & Readonly<{ alt: string }>;

const LANGS: readonly Lang[] = ['en', 'pl', 'nb'];
const GUIDES = asGuides(guidesContent.guides);

const localizedPath = localizedSitePath;

// Home captures exist in English and Polish; the Norwegian page shows the
// English set, as the Norwegian guides do.
const mediaLanguage = (language: Lang) => (language === 'pl' ? 'pl' : 'en');

const screenFor = (language: Lang, screen: ScreenCopy): Screen => ({
  ...getProductMediaPlacement(`${mediaLanguage(language)}-${screen.media}`),
  alt: screen.alt,
});

// Only guides that exist in the page language are linked; a missing
// translation leaves the link out rather than pointing to another language.
const guideFor = (language: Lang, topic: string): GuideEntry | undefined =>
  GUIDES.find((guide) => guide.language === language && guide.topic === topic);

const pageNames: Record<Lang, string> = {
  en: 'Shuuty - tasks, plans and reservations with friends and groups',
  pl: 'Shuuty - zadania, terminy i rezerwacje ze znajomymi i w grupach',
  nb: 'Shuuty - oppgaver, avtaler og reservasjoner med venner og grupper',
};

const carouselLabels: Record<
  Lang,
  Readonly<{
    roleDescription: string;
    region: string;
    active: string;
    bringToFront: string;
    choose: string;
    preview: string;
  }>
> = {
  en: {
    roleDescription: 'carousel',
    region: 'Shuuty app previews',
    active: 'Active view',
    bringToFront: 'Bring to front',
    choose: 'Choose a preview',
    preview: 'Preview',
  },
  pl: {
    roleDescription: 'karuzela',
    region: 'Podglądy aplikacji Shuuty',
    active: 'Widok aktywny',
    bringToFront: 'Pokaż na pierwszym planie',
    choose: 'Wybierz podgląd',
    preview: 'Podgląd',
  },
  nb: {
    roleDescription: 'karusell',
    region: 'Forhåndsvisninger av Shuuty-appen',
    active: 'Aktiv visning',
    bringToFront: 'Flytt fremst',
    choose: 'Velg forhåndsvisning',
    preview: 'Forhåndsvisning',
  },
};

const createSiteSchema = (language: Lang, copy: Copy) => {
  const pageUrl = `${SITE_URL}${localizedPath(language, '/')}`;
  const supportUrl = `${SITE_URL}${localizedPath(language, '/support/')}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: 'Shuuty',
        alternateName: 'Shuuty App',
        inLanguage: ['en', 'pl', 'nb'],
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
        email: 'support@shuuty.com',
        address: { '@type': 'PostalAddress', addressCountry: 'PL' },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'support@shuuty.com',
          url: supportUrl,
          availableLanguage: ['en', 'pl', 'nb'],
        },
        sameAs: [APP_STORE_DEVELOPER_URL, GOOGLE_PLAY_DEVELOPER_URL],
      },
      {
        '@type': ['SoftwareApplication', 'MobileApplication'],
        '@id': `${SITE_URL}/#mobile-app`,
        name: 'Shuuty',
        alternateName: 'Shuuty App',
        applicationCategory: 'LifestyleApplication',
        applicationSubCategory: 'Productivity',
        operatingSystem: 'iOS 15.1 or later, Android',
        inLanguage: ['en', 'pl', 'nb'],
        url: `${SITE_URL}/`,
        image: socialImage(language).url,
        downloadUrl: [APP_STORE_URL, GOOGLE_PLAY_URL],
        sameAs: [APP_STORE_URL, GOOGLE_PLAY_URL],
        screenshot: copy.hero.scopeSets.flatMap((set) => set.screens).map(
          (screen) => `${SITE_URL}${screenFor(language, screen).path}`,
        ),
        description: copy.hero.sub,
        featureList: copy.schema.features,
        softwareHelp: { '@type': 'CreativeWork', url: supportUrl },
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
        name: pageNames[language],
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
    case 'book':
      return <svg {...props}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5ZM9 7.5h7" /></svg>;
    case 'calendar':
      return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4m8-4v4M3 10h18" /></svg>;
    case 'check':
      return <svg {...props}><path d="m5 12 4 4L19 6" /></svg>;
    case 'community':
      return <svg {...props}><circle cx="8" cy="9" r="3" /><circle cx="17" cy="8" r="2" /><path d="M2.5 19c.7-3.2 2.7-5 5.5-5s4.8 1.8 5.5 5M14 13c3.7-.4 6.1 1.5 6.8 4.5" /></svg>;
    case 'download':
      return <svg {...props}><path d="M12 3v12m-5-5 5 5 5-5M5 21h14" /></svg>;
    case 'group':
      return <svg {...props}><circle cx="9" cy="8" r="3.2" /><path d="M3 19c.6-3.7 2.7-5.6 6-5.6s5.4 1.9 6 5.6M15.5 5.5a3 3 0 0 1 0 5.8M16.5 14c2.5.3 4 1.9 4.5 4.5" /></svg>;
    case 'map':
      return <svg {...props}><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z" /><path d="M8 3v15m8-12v15" /></svg>;
    case 'moon':
      return <svg {...props}><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" /></svg>;
    case 'people':
      return <svg {...props}><circle cx="8" cy="8" r="3" /><circle cx="17" cy="8.5" r="2.5" /><path d="M2.5 19c.6-3.6 2.5-5.5 5.5-5.5s4.9 1.9 5.5 5.5M14 14c3.7-.7 6.2 1 7 4.5" /></svg>;
    case 'sun':
      return <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
    case 'task':
      return <svg {...props}><rect x="4" y="3" width="16" height="18" rx="3" /><path d="m8 9 1.5 1.5L12 8m-4 7 1.5 1.5L12 14m2-5h2m-2 6h2" /></svg>;
    case 'work':
      return <svg {...props}><rect x="3" y="7" width="18" height="13" rx="3" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2" /></svg>;
  }
}

// The four steps in the nav and the mobile dock, in page order.
const STEP_ICONS: readonly IconName[] = ['task', 'people', 'map', 'group'];
// The hero chips reuse the colours and icons of steps 1, 2 and 4.
const HERO_SCOPE_STEPS = [1, 2, 4] as const;
const HERO_SCOPE_MS = 6000;
const HERO_SMOKE_TRAVEL_MS = 1100;
// The same colours as --gold-rgb, --blue-rgb and --group-rgb in globals.css.
const HERO_SMOKE_COLORS = {
  dark: [[255, 229, 160], [125, 211, 252], [139, 92, 246]],
  light: [[255, 176, 136], [137, 207, 240], [139, 92, 246]],
} as const;
const HERO_HOLD_AFTER_INPUT = 14000;

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
  clickEvent,
}: Readonly<{
  platform: 'apple' | 'google';
  label: string;
  prefix: string;
  href: string;
  clickEvent: string;
}>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={s.storeBtn}
      data-goatcounter-click={clickEvent}
      data-goatcounter-title={`${prefix} ${label}`}
    >
      {platform === 'apple' ? <AppleIcon /> : <PlayIcon />}
      <span className={s.storeBtnText}>
        <span className={s.storeBtnSmall}>{prefix}</span>
        <span className={s.storeBtnName}>{label}</span>
      </span>
    </a>
  );
}

function StoreButtons({
  copy,
  language,
  placement,
}: Readonly<{
  copy: Copy['store'];
  language: Lang;
  placement: StorePlacement;
}>) {
  const campaign = `web-home-${placement}-${language}`;
  const links = createStoreLinks(campaign);

  return (
    <div className={s.storeRow}>
      <StoreButton
        platform="apple"
        label={copy.apple}
        prefix={copy.applePrefix}
        href={links.ios}
        clickEvent={`store-ios-${placement}-${language}`}
      />
      <StoreButton
        platform="google"
        label={copy.google}
        prefix={copy.googlePrefix}
        href={links.android}
        clickEvent={`store-android-${placement}-${language}`}
      />
    </div>
  );
}

function GuideLink({
  guide,
  label,
}: Readonly<{ guide: GuideEntry; label: string }>) {
  return (
    <Link href={guidePath(guide)} className={s.guideLink}>
      <Icon name="book" />
      <span>{label}</span>
      <Icon name="arrow" />
    </Link>
  );
}

type CarouselCopy = (typeof carouselLabels)[Lang];

// One large screen in front, one or two smaller ones behind it. The screens
// are real captures, only scaled and framed. Tapping a screen behind brings
// it to the front and sends the front one back, like the hero carousel.
function StepStage({
  label,
  screens,
  carousel,
}: Readonly<{ label: string; screens: readonly Screen[]; carousel: CarouselCopy }>) {
  // order[position] = screen index; position 0 is the front.
  const [order, setOrder] = useState(() => screens.map((_, index) => index));
  const count = screens.length;
  const bringToFront = (position: number) =>
    setOrder((current) => {
      const next = [...current];
      [next[0], next[position]] = [next[position], next[0]];
      return next;
    });
  const sideClasses = count > 2 ? [s.stagePhoneRight, s.stagePhoneLeft] : [s.stagePhoneSide];

  return (
    <div
      className={`${s.stepStage} ${count > 2 ? s.stepStageTrio : ''}`}
      role="group"
      aria-label={`${label}: ${carousel.choose}`}
    >
      {screens.map((screen, index) => {
        const position = order.indexOf(index);
        const isFront = position === 0;
        return (
          <button
            type="button"
            key={screen.id}
            className={`${s.stagePhone} ${isFront ? s.stagePhoneMain : sideClasses[position - 1]}`}
            onClick={() => bringToFront(position)}
            aria-label={`${screen.alt}. ${isFront ? carousel.active : carousel.bringToFront}`}
            aria-pressed={isFront}
          >
            <ProductDeviceFrame
              media={screen}
              alt={screen.alt}
              sizes="(max-width: 720px) 60vw, 290px"
            />
          </button>
        );
      })}
    </div>
  );
}

type LoopOrbitCopy = Readonly<{ ringLabel: string; showing: string; again: string }>;

// Where each chip sits on the ring, in degrees of the ring's own plane.
const orbitAngle = (index: number) => index * 90 - 45;
// The ring angle that puts a chip at the front (the near edge, 180 degrees).
const frontRotation = (index: number) => 180 - orbitAngle(index);
const AUTO_SPEED = 7.5; // degrees per second: one turn in 48 s
const IDLE_BEFORE_AUTO = 3000;
const DRAG_DEGREES_PER_PIXEL = 0.45;

// The loop: the four steps on a ring around the group members screen. The
// list next to it is the semantic source (links to the steps); the ring is a
// set of buttons that choose which step's screen the phone shows. Hover or
// focus pauses the turning, a horizontal drag spins the ring with a little
// inertia, and the slow turn resumes after 3 s without input. With reduced
// motion the ring stands still and every change is instant.
function LoopOrbit({
  items,
  screens,
  selected,
  copy,
  onSelect,
  onOpen,
}: Readonly<{
  items: readonly string[];
  // screens[0] is the default (members); screens[i + 1] belongs to step i.
  screens: readonly Screen[];
  selected: number | null;
  copy: LoopOrbitCopy;
  onSelect: (index: number) => void;
  onOpen: (index: number) => void;
}>) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const spinRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const frontRef = useRef<number | null>(null);
  const [announce, setAnnounce] = useState('');
  const phoneId = useId();
  const motion = useRef({
    rotation: 0,
    velocity: 0,
    target: null as number | null,
    hovered: false,
    focused: false,
    dragging: false,
    reduced: false,
    lastInput: -Infinity,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startRotation: 0,
    lastX: 0,
    lastTime: 0,
    suppressClick: false,
  });
  // Until a step is chosen, the phone follows the chip at the front of the ring.
  const [front, setFront] = useState<number | null>(null);
  const shown = selected ?? front;
  const activeScreen = shown === null ? screens[0] : screens[shown + 1];

  useEffect(() => {
    const m = motion.current;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncReduced = () => {
      m.reduced = query.matches;
    };
    syncReduced();
    query.addEventListener('change', syncReduced);

    // A chip deeper than --orbit-fade-to is fully faded (see the CSS); it must
    // not catch taps over the phone either. The threshold changes with the
    // breakpoint, so it is read again on resize.
    // Without CSS cos() the chips never fade, so none of them may be made
    // untappable either (NaN never passes the depth test below).
    const canFade = typeof CSS !== 'undefined' && CSS.supports('opacity', 'cos(0deg)');
    let fadeTo = Number.NaN;
    const readFadeTo = () => {
      if (!stageRef.current || !canFade) return;
      fadeTo = Number.parseFloat(
        getComputedStyle(stageRef.current).getPropertyValue('--orbit-fade-to'),
      );
    };
    window.addEventListener('resize', readFadeTo);

    // The loop runs only while the ring is on screen and the tab is visible.
    let frame = 0;
    let previous = performance.now();
    let onScreen = false;
    const running = () => onScreen && document.visibilityState === 'visible';
    const start = () => {
      if (frame || !running()) return;
      readFadeTo();
      previous = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const tick = (now: number) => {
      const seconds = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      if (!m.dragging) {
        if (m.target !== null) {
          const distance = m.target - m.rotation;
          if (m.reduced || Math.abs(distance) < 0.2) {
            m.rotation = m.target;
            m.target = null;
          } else {
            m.rotation += distance * Math.min(1, seconds * 6);
          }
        } else if (!m.reduced && Math.abs(m.velocity) > 1) {
          m.rotation += m.velocity * seconds;
          m.velocity *= Math.pow(0.004, seconds);
        } else {
          m.velocity = 0;
          const idle = now - m.lastInput > IDLE_BEFORE_AUTO;
          if (!m.reduced && !m.hovered && !m.focused && idle) {
            m.rotation += AUTO_SPEED * seconds;
          }
        }
      }
      // Only a custom property on the spinning plane changes: the ring and the
      // chips turn by transform, nothing is laid out again.
      spinRef.current?.style.setProperty('--orbit-rot', `${m.rotation.toFixed(2)}deg`);
      let nearest = 0;
      let nearestDepth = Infinity;
      chipRefs.current.forEach((chip, index) => {
        const depth = Math.cos(((orbitAngle(index) + m.rotation) * Math.PI) / 180);
        if (depth < nearestDepth) {
          nearestDepth = depth;
          nearest = index;
        }
        if (!chip) return;
        const far = depth >= fadeTo;
        if (chip.hasAttribute('data-far') !== far) chip.toggleAttribute('data-far', far);
      });
      chipRefs.current.forEach((chip, index) => {
        const isFront = index === nearest;
        if (chip && chip.hasAttribute('data-front') !== isFront) {
          chip.toggleAttribute('data-front', isFront);
        }
      });
      if (nearest !== frontRef.current) {
        frontRef.current = nearest;
        setFront(nearest);
      }
      frame = running() ? requestAnimationFrame(tick) : 0;
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    if (stageRef.current) observer.observe(stageRef.current);
    const onVisibility = () => (running() ? start() : stop());
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', readFadeTo);
      query.removeEventListener('change', syncReduced);
    };
  }, []);

  const nearestFront = (index: number) => {
    const m = motion.current;
    const base = frontRotation(index);
    return base + 360 * Math.round((m.rotation - base) / 360);
  };

  const isAtFront = (index: number) =>
    Math.abs(motion.current.rotation - nearestFront(index)) < 25;

  // `now` is the event's timestamp (the same clock as performance.now()).
  const choose = (index: number, now: number) => {
    const m = motion.current;
    if (m.suppressClick) {
      m.suppressClick = false;
      return;
    }
    if (selected === index && isAtFront(index)) {
      onOpen(index);
      return;
    }
    m.velocity = 0;
    m.target = nearestFront(index);
    // A chosen step stays at the front a little longer before the turn resumes.
    m.lastInput = now + IDLE_BEFORE_AUTO;
    onSelect(index);
    setAnnounce(`${copy.showing} ${screens[index + 1].alt}`);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = ((selected ?? (step > 0 ? -1 : 0)) + step + items.length) % items.length;
    choose(next, event.timeStamp);
    chipRefs.current[next]?.focus({ preventScroll: true });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const m = motion.current;
    m.pointerId = event.pointerId;
    m.startX = event.clientX;
    m.startY = event.clientY;
    m.startRotation = m.rotation;
    m.lastX = event.clientX;
    m.lastTime = performance.now();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const m = motion.current;
    if (m.pointerId !== event.pointerId) return;
    const dx = event.clientX - m.startX;
    const dy = event.clientY - m.startY;
    if (!m.dragging) {
      // Only a clearly horizontal drag turns the ring; a vertical one is the
      // page scrolling and is left alone.
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        m.pointerId = -1;
        return;
      }
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      m.dragging = true;
      m.target = null;
      m.velocity = 0;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const now = performance.now();
    // Dragging right moves the near edge of the ring to the right.
    m.rotation = m.startRotation - dx * DRAG_DEGREES_PER_PIXEL;
    const instant = (-(event.clientX - m.lastX) * DRAG_DEGREES_PER_PIXEL * 1000)
      / Math.max(8, now - m.lastTime);
    m.velocity = m.velocity * 0.5 + instant * 0.5;
    m.lastX = event.clientX;
    m.lastTime = now;
    m.lastInput = now;
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const m = motion.current;
    if (m.pointerId !== event.pointerId) return;
    if (m.dragging) {
      m.dragging = false;
      m.suppressClick = true;
      m.lastInput = performance.now();
      // A little inertia, never a spin.
      m.velocity = m.reduced ? 0 : Math.max(-240, Math.min(240, m.velocity));
      // A click may not follow the drag (the pointer left the chip); clear the
      // guard on the next frame so the next real tap is not swallowed.
      window.setTimeout(() => {
        m.suppressClick = false;
      }, 0);
    }
    m.pointerId = -1;
  };

  return (
    <div
      ref={stageRef}
      className={s.orbitStage}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') motion.current.hovered = true;
      }}
      onPointerLeave={() => {
        motion.current.hovered = false;
        motion.current.lastInput = performance.now();
      }}
      onFocus={() => {
        motion.current.focused = true;
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          motion.current.focused = false;
          motion.current.lastInput = performance.now();
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className={s.orbitScene}>
        <div className={s.orbitGlow} aria-hidden="true" />
        <figure id={phoneId} className={s.orbitPhone}>
          {screens.map((screen, index) => {
            const isActive = screen.id === activeScreen.id;
            return (
              <span
                key={screen.id}
                className={`${s.orbitScreen} ${isActive ? s.orbitScreenActive : ''}`}
                aria-hidden={isActive ? undefined : true}
                data-screen={index}
              >
                <ProductDeviceFrame
                  media={screen}
                  alt={isActive ? screen.alt : ''}
                  sizes="(max-width: 720px) 52vw, 240px"
                />
              </span>
            );
          })}
        </figure>
        <div className={s.orbitPlane}>
          <div className={`${s.orbitRing} ${s.orbitRingBack}`} aria-hidden="true" />
          <div className={`${s.orbitRing} ${s.orbitRingFront}`} aria-hidden="true" />
          <div
            ref={spinRef}
            className={s.orbitSpin}
            role="group"
            aria-label={copy.ringLabel}
            onKeyDown={handleKeyDown}
          >
            {items.map((item, index) => (
              <div
                key={item}
                className={s.orbitItem}
                style={{ '--orbit-angle': `${orbitAngle(index)}deg` } as CSSProperties}
              >
                <div className={s.orbitCounter}>
                  <div className={s.orbitFace}>
                    <button
                      ref={(element) => {
                        chipRefs.current[index] = element;
                      }}
                      type="button"
                      className={s.orbitChip}
                      data-step={index + 1}
                      aria-pressed={selected === index}
                      aria-controls={phoneId}
                      onClick={(event) => choose(index, event.timeStamp)}
                    >
                      <Icon name={STEP_ICONS[index]} />
                      {item}
                      {selected === index ? <span className={s.srOnly}>{` ${copy.again}`}</span> : null}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className={s.srOnly} aria-live="polite">{announce}</p>
    </div>
  );
}

export default function HomePageClient({ initialLanguage }: { initialLanguage: Lang }) {
  const { language: lang, changeLanguage: switchLang } = useSiteLanguage(initialLanguage);
  const [theme, setTheme] = useState<Theme>('dark');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [activeHeroPhone, setActiveHeroPhone] = useState(0);
  const [heroScope, setHeroScope] = useState(0);
  // The phones change when the smoke from the new word reaches them.
  const [heroPhonesScope, setHeroPhonesScope] = useState(0);
  const heroLastInput = useRef(-Infinity);
  const heroScopesRef = useRef<HTMLSpanElement | null>(null);
  const heroVisualRef = useRef<HTMLDivElement | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [loopStep, setLoopStep] = useState<number | null>(null);
  const carouselPointerStart = useRef<number | null>(null);
  const carouselDidSwipe = useRef(false);
  const heroPhoneButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const lastScrollY = useRef(0);
  const mobileNavScrollDelta = useRef(0);
  const mobileNavHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const c = t[lang];
  const hasGuides = guidesIn(GUIDES, lang).length > 0;
  const carousel = carouselLabels[lang];
  const guideLabel = (topic: string) => c.guideLabels[topic as GuideTopic];

  const clearMobileNavTimer = useCallback(() => {
    if (!mobileNavHideTimer.current) return;
    clearTimeout(mobileNavHideTimer.current);
    mobileNavHideTimer.current = null;
  }, []);

  const scheduleMobileNavHide = useCallback(() => {
    clearMobileNavTimer();
    mobileNavHideTimer.current = setTimeout(() => {
      setShowMobileNav(false);
      mobileNavHideTimer.current = null;
    }, 2200);
  }, [clearMobileNavTimer]);

  // Three places (on your own, with friends, in groups), three phones each.
  // Every phone slot holds the screen of all three sets, so a change of place
  // is a cross-fade between images that have already loaded.
  const heroSets = c.hero.scopeSets.map((set) => ({
    scope: set.scope,
    phones: set.screens.map((screen) => screenFor(lang, screen)),
  }));
  const heroPhones = heroSets[heroPhonesScope].phones;
  const steps = c.how.steps.map((step) => ({
    ...step,
    screens: step.screens.map((screen) => screenFor(lang, screen)),
    links: step.guides
      .map((topic) => ({ topic, guide: guideFor(lang, topic) }))
      .filter((entry): entry is { topic: string; guide: GuideEntry } => Boolean(entry.guide)),
  }));
  const loopScreen = screenFor(lang, c.how.loop.screen);
  const useCases = c.uses.items.map((item) => {
    const topic = item.guides.find((candidate) => guideFor(lang, candidate));
    return { ...item, topic, guide: topic ? guideFor(lang, topic) : undefined };
  });
  const navItems = [
    { href: `#${c.how.steps[0].id}`, label: c.nav.tasks },
    { href: `#${c.how.steps[1].id}`, label: c.nav.friends },
    { href: `#${c.how.steps[2].id}`, label: c.nav.discover },
    { href: `#${c.how.steps[3].id}`, label: c.nav.groups },
  ];

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
        const nextIndex = (activeHeroPhone - 1 + heroPhones.length) % heroPhones.length;
        selectHeroPhone(nextIndex);
        heroPhoneButtons.current[nextIndex]?.focus({ preventScroll: true });
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        const nextIndex = (activeHeroPhone + 1) % heroPhones.length;
        selectHeroPhone(nextIndex);
        heroPhoneButtons.current[nextIndex]?.focus({ preventScroll: true });
      }
    },
    [activeHeroPhone, heroPhones.length, selectHeroPhone],
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

  // The place in the headline and the phones change together every few
  // seconds; a choice by the reader holds it for a while, and with reduced
  // motion it never changes by itself.
  const chooseHeroScope = useCallback((index: number) => {
    heroLastInput.current = performance.now();
    setHeroScope(index);
    setActiveHeroPhone(0);
  }, []);

  useEffect(() => {
    if (heroPhonesScope === heroScope) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setHeroPhonesScope(heroScope), reduced ? 0 : HERO_SMOKE_TRAVEL_MS);
    return () => window.clearTimeout(timer);
  }, [heroScope, heroPhonesScope]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const timer = window.setInterval(() => {
      if (reduced.matches || document.visibilityState !== 'visible') return;
      if (performance.now() - heroLastInput.current < HERO_HOLD_AFTER_INPUT) return;
      setHeroScope((current) => (current + 1) % 3);
      setActiveHeroPhone(0);
    }, HERO_SCOPE_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  }, []);

  useEffect(() => {
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
        scheduleMobileNavHide();
      }

      lastScrollY.current = currentScrollY;
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => {
      window.removeEventListener('scroll', handler);
      clearMobileNavTimer();
    };
  }, [clearMobileNavTimer, scheduleMobileNavHide]);

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

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const steps = c.how.steps
      .map((step) => document.getElementById(step.id))
      .filter((element): element is HTMLElement => element !== null);
    let observer: IntersectionObserver | null = null;
    // A band through the middle of the viewport. It is set in pixels from the
    // viewport height: percentage margins are resolved against the root width,
    // which collapses the band on landscape phones.
    const connect = () => {
      observer?.disconnect();
      const inset = Math.round(window.innerHeight * 0.45);
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveStep(entry.target.id);
          });
        },
        { rootMargin: `-${inset}px 0px -${inset}px 0px` },
      );
      steps.forEach((step) => observer?.observe(step));
    };
    connect();
    window.addEventListener('resize', connect);
    return () => {
      window.removeEventListener('resize', connect);
      observer?.disconnect();
    };
  }, [c.how.steps]);

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

  const hideMobileNav = () => {
    clearMobileNavTimer();
    setShowMobileNav(false);
  };

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
              <Image src="/images/brand/shuuty-app-icon.png" alt="" width={40} height={40} loading="eager" />
            </span>
            <span className={s.brandName}>Shuuty</span>
          </a>

          <div className={s.navLinks}>
            {navItems.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </div>

          <div className={s.navActions}>
            {hasGuides ? (
              <Link href={localizedPath(lang, '/guides/')} className={s.navGuides}>
                <Icon name="book" />
                <span>{guidesContent.index[lang].navTitle}</span>
              </Link>
            ) : null}
            <button
              type="button"
              className={s.themeBtn}
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? c.a11y.themeToLight : c.a11y.themeToDark}
              title={theme === 'dark' ? c.a11y.themeToLight : c.a11y.themeToDark}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <LanguageMenu
              language={lang}
              languages={LANGS}
              label={c.a11y.language}
              onLanguageChange={switchLang}
            />
            <a href="#download" className={s.navCta}>{c.nav.download}</a>
          </div>
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
        <section id="top" className={s.hero}>
          <HeroSmoke
            className={s.heroSmoke}
            sourceRef={heroScopesRef}
            targetRef={heroVisualRef}
            colors={HERO_SMOKE_COLORS}
            active={heroScope}
          />
          <div className={s.heroCopy}>
            <span className={s.eyebrow}><span className={s.statusDot} />{c.hero.badge}</span>
            <h1 className={s.heroTitle}>
              {c.hero.title}{' '}
              <span className={s.srOnly}>{c.hero.accent}</span>
              {/* One place at a time in the step colours, together with the
                  phones: on your own, with friends, in groups. The sentence
                  above is what a screen reader and a search engine read; with
                  reduced motion the whole sentence stands still. */}
              <span ref={heroScopesRef} className={s.heroScopes} aria-hidden="true">
                {heroSets.map((set, index) => (
                  <span
                    key={set.scope}
                    className={s.heroScope}
                    data-step={HERO_SCOPE_STEPS[index]}
                    data-active={index === heroScope ? '' : undefined}
                  >
                    {set.scope}
                  </span>
                ))}
              </span>
              <span className={s.heroScopesStill} aria-hidden="true">{c.hero.accent}</span>
            </h1>
            <p className={s.heroLead}>{c.hero.sub}</p>
            <div className={s.heroActions}>
              <StoreButtons copy={c.store} language={lang} placement="hero" />
              <a href="#how-it-works" className={s.textCta}>
                {c.hero.secondaryCta}<Icon name="arrow" />
              </a>
            </div>
          </div>

          <div
            ref={heroVisualRef}
            className={s.heroVisual}
            role="region"
            aria-roledescription={carousel.roleDescription}
            aria-label={carousel.region}
            data-step={HERO_SCOPE_STEPS[heroPhonesScope]}
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
                  ref={(element) => {
                    heroPhoneButtons.current[index] = element;
                  }}
                  type="button"
                  key={`slot-${index}`}
                  className={`${s.phone} ${positionClass}`}
                  onClick={() => {
                    if (carouselDidSwipe.current) {
                      carouselDidSwipe.current = false;
                      return;
                    }
                    heroLastInput.current = performance.now();
                    selectHeroPhone(index);
                  }}
                  aria-label={`${phone.alt}. ${
                    isActive
                      ? carousel.active
                      : carousel.bringToFront
                  }`}
                  aria-pressed={isActive}
                >
                  {heroSets.map((set, setIndex) => {
                    const media = set.phones[index];
                    const shown = setIndex === heroPhonesScope;
                    return (
                      <span
                        key={media.id}
                        className={s.heroPhoneLayer}
                        data-shown={shown ? '' : undefined}
                        aria-hidden={shown ? undefined : true}
                      >
                        <ProductDeviceFrame
                          media={media}
                          alt={shown ? media.alt : ''}
                          // The first set holds the LCP picture; the other two
                          // load right after, so a change of place never waits.
                          loading={setIndex === 0 && index !== 1 ? 'eager' : 'lazy'}
                          fetchPriority={setIndex === 0 && index === 0 ? 'high' : undefined}
                          sizes={isActive ? '(max-width: 720px) 55vw, 290px' : '(max-width: 720px) 34vw, 190px'}
                        />
                      </span>
                    );
                  })}
                </button>
              );
            })}
            <div className={s.heroScopeTabs} role="group" aria-label={carousel.choose}>
              {heroSets.map((set, index) => (
                <button
                  type="button"
                  key={`${set.scope}-tab`}
                  className={s.heroScopeTab}
                  data-step={HERO_SCOPE_STEPS[index]}
                  aria-pressed={index === heroScope}
                  onClick={() => chooseHeroScope(index)}
                >
                  <span className={s.heroScopeTabLabel}>{set.scope}</span>
                </button>
              ))}
            </div>
            <p className={s.srOnly} aria-live="polite">
              {`${heroSets[heroPhonesScope].scope}: ${heroPhones[activeHeroPhone].alt}`}
            </p>
          </div>

          <ol className={s.heroSteps} aria-label={c.how.heading}>
            {navItems.map((item, index) => (
              <li key={item.href} data-step={index + 1}>
                <a href={item.href}>
                  <span className={s.heroStepNumber} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Icon name={STEP_ICONS[index]} />
                  <span className={s.heroStepLabel}>{item.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section id="how-it-works" className={`${s.section} ${s.howSection}`}>
          <div className={s.container}>
            <div className={`${s.sectionIntro} ${s.centeredIntro} ${s.reveal}`} data-reveal>
              <span className={s.sectionLabel}>{c.how.label}</span>
              <h2>{c.how.heading}</h2>
              <p>{c.how.lead}</p>
            </div>

            <ol className={s.stepList}>
              {steps.map((step, index) => (
                <li
                  key={step.id}
                  id={step.id}
                  className={`${s.step} ${s.reveal}`}
                  data-reveal
                  data-step={index + 1}
                >
                  <StepStage label={step.title} screens={step.screens} carousel={carousel} />
                  <div className={s.stepCopy}>
                    <span className={s.stepNumber} aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3>
                      <span className={s.srOnly}>{`${index + 1}. `}</span>
                      {step.title}
                    </h3>
                    <p className={s.stepText}>{step.text}</p>
                    <ul className={s.stepPoints}>
                      {step.points.map((point) => (
                        <li key={point}><Icon name="check" />{point}</li>
                      ))}
                    </ul>
                    {step.links.length > 0 ? (
                      <div className={s.guideLinks}>
                        {step.links.map(({ topic, guide }) => (
                          <GuideLink key={topic} guide={guide} label={guideLabel(topic)} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>

            <div className={`${s.loop} ${s.reveal}`} data-reveal>
              <div className={s.loopIntro}>
                <h3 className={s.loopHeading}>{c.how.loop.heading}</h3>
                <p className={s.loopText}>{c.how.loop.text}</p>
              </div>
              <LoopOrbit
                items={c.how.loop.chain.map((item) => item.title)}
                screens={[loopScreen, ...steps.map((step) => step.screens[0])]}
                selected={loopStep}
                copy={c.how.loop}
                onSelect={setLoopStep}
                onOpen={(index) => {
                  window.location.hash = c.how.steps[index].id;
                }}
              />
              <ol className={s.loopList}>
                  {c.how.loop.chain.map((item, index) => (
                    <li
                      key={item.title}
                      data-step={index + 1}
                      data-active={loopStep === index ? 'true' : undefined}
                    >
                      <a href={navItems[index].href}>
                        <span className={s.loopListIcon}><Icon name={STEP_ICONS[index]} /></span>
                        <span className={s.loopListText}>
                          <strong>{item.title}</strong>
                          <span>{item.text}</span>
                        </span>
                      </a>
                    </li>
                  ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="use-cases" className={`${s.section} ${s.usesSection}`}>
          <div className={s.container}>
            <div className={`${s.sectionIntro} ${s.reveal}`} data-reveal>
              <span className={s.sectionLabel}>{c.uses.label}</span>
              <h2>{c.uses.heading}</h2>
              <p>{c.uses.lead}</p>
            </div>
            <ul className={`${s.useGrid} ${s.reveal}`} data-reveal>
              {useCases.map((item) => (
                <li key={item.title} className={s.useCard}>
                  <span className={s.useIcon}><Icon name={item.icon as IconName} /></span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  {item.guide && item.topic ? (
                    <GuideLink guide={item.guide} label={guideLabel(item.topic)} />
                  ) : null}
                </li>
              ))}
            </ul>
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
            <StoreButtons copy={c.store} language={lang} placement="download" />
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
            <Link href={localizedPath(lang, '/facts/')}>{c.footer.facts}</Link>
            {hasGuides ? (
              <Link href={localizedPath(lang, '/guides/')}>
                {guidesContent.index[lang].navTitle}
              </Link>
            ) : null}
            <Link href={localizedPath(lang, '/account-deletion/')}>
              {c.footer.accountDeletion}
            </Link>
            <Link href={localizedPath(lang, '/child-safety/')}>{c.footer.childSafety}</Link>
            <Link href={localizedPath(lang, '/privacy/')}>{c.footer.privacy}</Link>
            <Link href={localizedPath(lang, '/terms/')}>{c.footer.terms}</Link>
          </nav>
        </div>
      </footer>

      <nav
        className={`${s.mobileNav} ${showMobileNav ? s.mobileNavVisible : ''}`}
        aria-label={c.a11y.mainNav}
        onFocusCapture={() => {
          clearMobileNavTimer();
          setShowMobileNav(true);
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            scheduleMobileNavHide();
          }
        }}
        onPointerEnter={clearMobileNavTimer}
        onPointerLeave={scheduleMobileNavHide}
      >
        {navItems.map((item, index) => (
          <a
            key={item.href}
            href={item.href}
            onClick={hideMobileNav}
            aria-label={item.label}
            aria-current={activeStep && item.href === `#${activeStep}` ? 'location' : undefined}
            data-step={index + 1}
          >
            <Icon name={STEP_ICONS[index]} />
          </a>
        ))}
        <a href="#download" onClick={hideMobileNav} className={s.mobileDownload} aria-label={c.nav.download}><Icon name="download" /></a>
      </nav>
    </div>
  );
}
