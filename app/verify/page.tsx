'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';

const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.shuuty&hl=en-US';
const IOS_STORE_URL = 'https://apps.apple.com/no/app/shuuty/id6670202422';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'fallback'>('loading');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!token) {
      setStatus('fallback');
      return;
    }

    // Try to open the app via deeplink
    const deepLink = `shuuty://auth/verify?token=${encodeURIComponent(token)}`;
    
    // Create a hidden iframe to attempt app opening without leaving the page
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);

    // Also try window.location for better compatibility
    const redirectTimeout = setTimeout(() => {
      window.location.href = deepLink;
    }, 100);

    setStatus('redirecting');

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
      clearTimeout(redirectTimeout);
      clearInterval(countdownInterval);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };
  }, [token]);

  const handleOpenApp = () => {
    if (token) {
      window.location.href = `shuuty://auth/verify?token=${encodeURIComponent(token)}`;
    }
  };

  const getStoreUrl = () => {
    if (typeof navigator === 'undefined') return null;
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/i.test(userAgent)) {
      return ANDROID_STORE_URL;
    }
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      return IOS_STORE_URL;
    }
    return null;
  };

  return (
    <div className={styles.container}>
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
            <p className={styles.message}>Verifying...</p>
          </div>
        )}

        {status === 'redirecting' && (
          <div className={styles.content}>
            <div className={styles.iconSuccess}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="22,4 12,14.01 9,11.01" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className={styles.title}>Opening app...</h2>
            <p className={styles.subtitle}>
              Redirecting in {countdown}s
            </p>
          </div>
        )}

        {status === 'fallback' && (
          <div className={styles.content}>
            <h2 className={styles.title}>Can&apos;t open the app?</h2>
            <p className={styles.subtitle}>
              Click the button below or download the app
            </p>
            
            <button onClick={handleOpenApp} className={styles.ctaButton}>
              Open Shuuty app
            </button>

            {getStoreUrl() && (
              <a 
                href={getStoreUrl() || '#'} 
                className={styles.storeLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download app
              </a>
            )}

            <p className={styles.helpText}>
              If you already have the app installed, click &quot;Open Shuuty app&quot;.
              Otherwise, download it from the store.
            </p>
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
          <div className={styles.content}>
            <div className={styles.spinner} />
            <p className={styles.message}>Loading...</p>
          </div>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
