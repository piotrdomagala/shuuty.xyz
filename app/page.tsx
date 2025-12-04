'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Cookies from 'js-cookie';
import styles from './page.module.css';

type Language = 'en' | 'pl';

interface Translations {
  mainTitle: string;
  mainTitleHighlight: string;
  description: string;
  downloadTitle: string;
  support: string;
  privacy: string;
  terms: string;
  footer: string;
}

const translations: Record<Language, Translations> = {
  en: {
    mainTitle: 'Find Those',
    mainTitleHighlight: 'You Seek',
    description: 'Arrange activities wherever you are. Meet new people similar to you and plan your time like never before.',
    downloadTitle: 'Download the app on mobile',
    support: 'Support',
    privacy: 'Privacy',
    terms: 'Terms',
    footer: '© 2025 Shuuty. All rights reserved.',
  },
  pl: {
    mainTitle: 'Znajdź Tych,',
    mainTitleHighlight: 'Których Szukasz',
    description: 'Umów się na aktywność, gdziekolwiek jesteś. Poznaj nowych ludzi podobnych do Ciebie i zaplanuj swój czas jak nigdy wcześniej.',
    downloadTitle: 'Pobierz aplikację na telefon',
    support: 'Wsparcie',
    privacy: 'Prywatność',
    terms: 'Regulamin',
    footer: '© 2025 Shuuty. Wszelkie prawa zastrzeżone.',
  },
};

const languageOptions: { code: Language; name: string; icon: string }[] = [
  { code: 'en', name: 'English', icon: '/images/english_icon.png' },
  { code: 'pl', name: 'Polski', icon: '/images/polish_icon.png' },
];

const screenshots = [
  { src: '/images/image1.webp', alt: 'Shuuty App Screenshot 1' },
  { src: '/images/image2.webp', alt: 'Shuuty App Screenshot 2' },
  { src: '/images/image3.webp', alt: 'Shuuty App Screenshot 3' },
  { src: '/images/image4.webp', alt: 'Shuuty App Screenshot 4' },
  { src: '/images/image5.webp', alt: 'Shuuty App Screenshot 5' },
];

export default function HomePage() {
  const [language, setLanguage] = useState<Language>('en');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Initialize language from cookie
  useEffect(() => {
    setMounted(true);
    const savedLang = Cookies.get('lang') as Language | undefined;
    if (savedLang && (savedLang === 'en' || savedLang === 'pl')) {
      setLanguage(savedLang);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = useCallback((newLang: Language) => {
    setLanguage(newLang);
    Cookies.set('lang', newLang, { expires: 365 });
    setIsDropdownOpen(false);
  }, []);

  const handleCarouselScroll = useCallback(() => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const slideWidth = carouselRef.current.offsetWidth * 0.7;
      const newSlide = Math.round(scrollLeft / slideWidth);
      setCurrentSlide(Math.min(newSlide, screenshots.length - 1));
    }
  }, []);

  const scrollToSlide = useCallback((index: number) => {
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.offsetWidth * 0.7;
      carouselRef.current.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth',
      });
    }
  }, []);

  const t = translations[language];
  const currentLangOption = languageOptions.find((l) => l.code === language)!;

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Animated Background Decorations */}
      <div className={styles.backgroundDecor}>
        <div className={`${styles.floatingShape} ${styles.shape1}`} />
        <div className={`${styles.floatingShape} ${styles.shape2}`} />
        <div className={`${styles.floatingShape} ${styles.shape3}`} />
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoContainer}>
            <div className={styles.logoGlow} />
            <Image
              src="/images/shuuty_icon.webp"
              alt="Shuuty"
              width={52}
              height={52}
              className={styles.logo}
              priority
            />
          </div>

          {/* Language Switcher */}
          <div className={styles.languageSwitcher} ref={dropdownRef}>
            <button
              className={styles.languageButton}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
            >
              <Image
                src={currentLangOption.icon}
                alt={currentLangOption.name}
                width={22}
                height={22}
                className={styles.languageIcon}
              />
              <span>{currentLangOption.name}</span>
              <svg
                className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ''}`}
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div
              className={`${styles.languageDropdown} ${isDropdownOpen ? styles.languageDropdownOpen : ''}`}
              role="listbox"
            >
              {languageOptions.map((option) => (
                <button
                  key={option.code}
                  className={styles.languageOption}
                  onClick={() => handleLanguageChange(option.code)}
                  role="option"
                  aria-selected={option.code === language}
                >
                  <Image
                    src={option.icon}
                    alt={option.name}
                    width={22}
                    height={22}
                    className={styles.languageIcon}
                  />
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <section className={styles.heroSection}>
          {/* Screenshots - Desktop */}
          <div className={styles.screenshotsContainer}>
            <div className={styles.screenshotCard}>
              <Image
                src={screenshots[0].src}
                alt={screenshots[0].alt}
                width={280}
                height={560}
                className={styles.screenshot}
                priority
              />
              <div className={styles.glassOverlay} />
            </div>
            <div className={styles.screenshotCard}>
              <Image
                src={screenshots[1].src}
                alt={screenshots[1].alt}
                width={280}
                height={560}
                className={styles.screenshot}
                priority
              />
              <div className={styles.glassOverlay} />
            </div>
          </div>

          {/* Mobile Carousel */}
          <div className={styles.mobileCarousel}>
            <div
              ref={carouselRef}
              className={styles.carouselTrack}
              onScroll={handleCarouselScroll}
            >
              {screenshots.map((shot, index) => (
                <div key={index} className={styles.carouselSlide}>
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    width={240}
                    height={480}
                    className={styles.screenshot}
                    priority={index < 2}
                  />
                </div>
              ))}
            </div>
            <div className={styles.carouselDots}>
              {screenshots.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.dot} ${currentSlide === index ? styles.dotActive : ''}`}
                  onClick={() => scrollToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className={styles.contentSection}>
            <div className={styles.titleContainer}>
              <h1 className={styles.mainTitle}>
                {t.mainTitle}{' '}
                <span className={styles.titleHighlight}>{t.mainTitleHighlight}</span>
              </h1>
              <p className={styles.description}>{t.description}</p>
            </div>

            <div className={styles.downloadSection}>
              <h2 className={styles.downloadTitle}>{t.downloadTitle}</h2>
              <div className={styles.downloadButtons}>
                <a
                  href="https://play.google.com/store/apps/details?id=com.shuuty&hl=en-US"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.storeButton}
                >
                  <Image
                    src="/images/your_android_icon.png"
                    alt="Get it on Google Play"
                    width={165}
                    height={52}
                    className={styles.storeImage}
                  />
                </a>
                <a
                  href="https://apps.apple.com/no/app/shuuty/id6670202422"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.storeButton}
                >
                  <Image
                    src="/images/your_ios_icon.png"
                    alt="Download on the App Store"
                    width={165}
                    height={52}
                    className={styles.storeImage}
                  />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <span className={styles.footerText}>{t.footer}</span>
          <nav className={styles.footerLinks}>
            <Link href="/support" className={styles.footerLink}>
              {t.support}
            </Link>
            <Link href="/privacy" className={styles.footerLink}>
              {t.privacy}
            </Link>
            <Link href="/terms" className={styles.footerLink}>
              {t.terms}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

