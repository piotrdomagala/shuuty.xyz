'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';

const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.shuuty&hl=en-US';
const IOS_STORE_URL = 'https://apps.apple.com/no/app/shuuty/id6670202422';

type Status = 'loading' | 'redirecting' | 'fallback' | 'error';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [countdown, setCountdown] = useState(3);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    // Try to open the app via deeplink
    const deepLink = `shuuty://auth/verify?token=${token}`;
    
    // Create a hidden iframe to attempt app opening without leaving the page
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);

    // Also try window.location for better compatibility
    const locationTimeout = setTimeout(() => {
      window.location.href = deepLink;
    }, 100);

    setStatus('redirecting');
    setShowConfetti(true);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setStatus('fallback');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup
    return () => {
      clearTimeout(locationTimeout);
      clearInterval(countdownInterval);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };
  }, [token]);

  const handleOpenApp = useCallback(() => {
    if (token) {
      window.location.href = `shuuty://auth/verify?token=${token}`;
    }
  }, [token]);

  const getStoreUrl = useCallback(() => {
    if (typeof navigator === 'undefined') return null;
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/i.test(userAgent)) {
      return ANDROID_STORE_URL;
    }
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      return IOS_STORE_URL;
    }
    return null;
  }, []);

  const storeUrl = getStoreUrl();

  return (
    <div className={styles.container}>
      {/* Confetti Effect */}
      {showConfetti && (
        <div className={styles.confettiContainer}>
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className={`${styles.confetti} ${showConfetti ? styles.active : ''}`}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#667eea', '#7dd3fc', '#ffe5a0', '#34d399', '#fbbf24'][
                  Math.floor(Math.random() * 5)
                ],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
              }}
            />
          ))}
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <Image 
            src="/images/shuuty_icon.webp" 
            alt="Shuuty" 
            width={72}
            height={72}
            className={styles.logo}
            priority
          />
          <h1 className={styles.brandName}>Shuuty</h1>
        </div>

        <div className={styles.divider} />

        {status === 'loading' && (
          <div className={styles.content}>
            <div className={styles.spinner} />
            <p className={styles.message}>Weryfikacja...</p>
          </div>
        )}

        {status === 'redirecting' && (
          <div className={styles.content}>
            <div className={styles.iconContainer}>
              <div className={styles.iconSuccess}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="22,4 12,14.01 9,11.01" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.iconRing} />
            </div>
            <h2 className={styles.title}>Otwieranie aplikacji...</h2>
            <p className={styles.subtitle}>
              Przekierowanie za
              <span className={styles.countdown}>{countdown}</span>
            </p>
          </div>
        )}

        {status === 'fallback' && (
          <div className={styles.content}>
            <h2 className={styles.title}>Nie możesz otworzyć aplikacji?</h2>
            <p className={styles.subtitle}>
              Kliknij przycisk poniżej lub pobierz aplikację
            </p>
            
            <button onClick={handleOpenApp} className={styles.ctaButton}>
              Otwórz aplikację Shuuty
            </button>

            {storeUrl && (
              <a 
                href={storeUrl} 
                className={styles.storeLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Pobierz aplikację
              </a>
            )}

            <p className={styles.helpText}>
              Jeśli masz już zainstalowaną aplikację, kliknij &quot;Otwórz aplikację&quot;.
              W przeciwnym razie pobierz ją ze sklepu.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.content}>
            <div className={styles.iconError}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className={styles.title}>Brakujący token</h2>
            <p className={styles.subtitle}>
              Link weryfikacyjny jest nieprawidłowy lub wygasł.
              Spróbuj ponownie lub skontaktuj się z pomocą techniczną.
            </p>
            
            {storeUrl && (
              <a 
                href={storeUrl} 
                className={styles.storeLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Pobierz aplikację
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logoContainer}>
            <div className={styles.spinner} />
          </div>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}

