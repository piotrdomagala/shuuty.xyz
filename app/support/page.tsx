'use client';

import { useState, useEffect, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Cookies from 'js-cookie';
import styles from '../documents.module.css';

type Language = 'en' | 'pl';

const translations = {
  en: {
    pageTitle: 'Contact Support',
    pageSubtitle: "We're here to help! Reach out to our support team and we'll get back to you within 24 hours.",
    formTitle: 'Get in Touch',
    formSubtitle: "Describe your issue or question and we'll provide you with the best assistance possible.",
    nameLabel: 'Your Name',
    namePlaceholder: 'Enter your full name',
    emailLabel: 'Email Address',
    emailPlaceholder: 'your.email@example.com',
    messageLabel: 'Message',
    messagePlaceholder: 'Tell us how we can help you...',
    submitButton: 'Send Message',
    sending: 'Sending...',
    successTitle: 'Thank you!',
    successMessage: "We've received your message and will get back to you within 24 hours.",
    support: 'Support',
    privacy: 'Privacy',
    terms: 'Terms',
    footerTagline: 'Connecting people through meaningful activities',
  },
  pl: {
    pageTitle: 'Kontakt z pomocą',
    pageSubtitle: 'Jesteśmy tu, aby pomóc! Skontaktuj się z naszym zespołem wsparcia, a odpowiemy w ciągu 24 godzin.',
    formTitle: 'Skontaktuj się',
    formSubtitle: 'Opisz swój problem lub pytanie, a zapewnimy Ci najlepszą możliwą pomoc.',
    nameLabel: 'Twoje imię',
    namePlaceholder: 'Wpisz swoje imię i nazwisko',
    emailLabel: 'Adres e-mail',
    emailPlaceholder: 'twoj.email@example.com',
    messageLabel: 'Wiadomość',
    messagePlaceholder: 'Powiedz nam, jak możemy Ci pomóc...',
    submitButton: 'Wyślij wiadomość',
    sending: 'Wysyłanie...',
    successTitle: 'Dziękujemy!',
    successMessage: 'Otrzymaliśmy Twoją wiadomość i odpowiemy w ciągu 24 godzin.',
    support: 'Wsparcie',
    privacy: 'Prywatność',
    terms: 'Regulamin',
    footerTagline: 'Łączymy ludzi poprzez wspólne aktywności',
  },
};

export default function SupportPage() {
  const [language, setLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  useEffect(() => {
    setMounted(true);
    const savedLang = Cookies.get('lang') as Language | undefined;
    if (savedLang && (savedLang === 'en' || savedLang === 'pl')) {
      setLanguage(savedLang);
    }
  }, []);

  const t = translations[language];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSuccess(true);
    setFormData({ name: '', email: '', message: '' });
  };

  if (!mounted) return null;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.backgroundDecor}>
        <div className={`${styles.floatingShape} ${styles.shape1}`} />
        <div className={`${styles.floatingShape} ${styles.shape2}`} />
      </div>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.backButton} title="Back to home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className={styles.headerInfo}>
            <Image
              src="/images/shuuty_icon.webp"
              alt="Shuuty"
              width={40}
              height={40}
              className={styles.logo}
            />
            <h1 className={styles.headerTitle}>{t.pageTitle}</h1>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.contentCard}>
          {isSuccess ? (
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="22,4 12,14.01 9,11.01" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>{t.successTitle}</h3>
              <p>{t.successMessage}</p>
            </div>
          ) : (
            <div className={styles.formContainer}>
              <div className={styles.formIntro}>
                <h2>{t.formTitle}</h2>
                <p>{t.formSubtitle}</p>
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">{t.nameLabel}</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t.namePlaceholder}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">{t.emailLabel}</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t.emailPlaceholder}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message">{t.messageLabel}</label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t.messagePlaceholder}
                    required
                  />
                </div>

                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                  {isSubmitting ? t.sending : t.submitButton}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <h3>Shuuty</h3>
            <p>{t.footerTagline}</p>
          </div>
          <nav className={styles.footerLinks}>
            <Link href="/support" className={styles.footerLink}>{t.support}</Link>
            <Link href="/privacy" className={styles.footerLink}>{t.privacy}</Link>
            <Link href="/terms" className={styles.footerLink}>{t.terms}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

