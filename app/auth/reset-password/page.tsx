'use client';

import { Suspense, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '../../verify/page.module.css';

const BACKEND_API_URL = 'https://api.shuuty.xyz';
const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.shuuty&hl=en-US';
const IOS_STORE_URL = 'https://apps.apple.com/no/app/shuuty/id6670202422';
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+=-]{8,}$/;

function PasswordResetContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const passwordError = useMemo(() => {
    if (!password) {
      return '';
    }
    if (!passwordPattern.test(password)) {
      return 'Use at least 8 characters with letters and numbers.';
    }
    if (confirmPassword && password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return '';
  }, [confirmPassword, password]);

  const canSubmit =
    Boolean(token) &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    !passwordError &&
    status !== 'submitting';

  const getStoreUrl = () => {
    if (typeof navigator === 'undefined') {
      return null;
    }
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/i.test(userAgent)) {
      return ANDROID_STORE_URL;
    }
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      return IOS_STORE_URL;
    }
    return null;
  };

  const openApp = () => {
    window.location.href = 'shuuty://';
  };

  const submitReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !token) {
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({token, password}),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'This reset link is invalid or expired.');
      }

      setStatus('success');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We could not reset your password. Please request a new link.',
      );
    }
  };

  const storeUrl = getStoreUrl();

  if (!token) {
    return (
      <Shell>
        <div className={styles.content}>
          <h2 className={styles.title}>Invalid reset link</h2>
          <p className={styles.subtitle}>
            This link is missing a reset token. Please request a new password reset from the app.
          </p>
        </div>
      </Shell>
    );
  }

  if (status === 'success') {
    return (
      <Shell>
        <div className={styles.content}>
          <div className={styles.iconSuccess}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22,4 12,14.01 9,11.01" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className={styles.title}>Password updated</h2>
          <p className={styles.subtitle}>
            Your password has been changed. You can now sign in with the new password.
          </p>
          <button type="button" onClick={openApp} className={styles.ctaButton}>
            Open Shuuty app
          </button>
          {storeUrl ? (
            <a href={storeUrl} className={styles.storeLink} target="_blank" rel="noopener noreferrer">
              Download app
            </a>
          ) : null}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className={styles.content}>
        <h2 className={styles.title}>Set a new password</h2>
        <p className={styles.subtitle}>
          Choose a password you have not used before. The reset link can be used only once.
        </p>

        <form onSubmit={submitReset} className={styles.form}>
          <label className={styles.fieldLabel} htmlFor="password">
            New password
          </label>
          <input
            id="password"
            className={styles.input}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={128}
            required
          />

          <label className={styles.fieldLabel} htmlFor="confirm-password">
            Repeat password
          </label>
          <input
            id="confirm-password"
            className={styles.input}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            maxLength={128}
            required
          />

          <p className={styles.requirementText}>
            Minimum 8 characters, including at least one letter and one number.
          </p>

          {(passwordError || errorMessage) && (
            <p className={styles.errorText}>{passwordError || errorMessage}</p>
          )}

          <button type="submit" className={styles.ctaButton} disabled={!canSubmit}>
            {status === 'submitting' ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </Shell>
  );
}

function Shell({children}: {children: ReactNode}) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <h1 className={styles.brandName}>Shuuty</h1>
        </div>
        <div className={styles.divider} />
        {children}
      </div>
    </div>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={
      <Shell>
        <div className={styles.content}>
          <div className={styles.spinner} />
          <p className={styles.message}>Loading...</p>
        </div>
      </Shell>
    }>
      <PasswordResetContent />
    </Suspense>
  );
}
