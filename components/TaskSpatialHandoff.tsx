'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import s from '@/app/page.module.css';
import ProductDeviceFrame from '@/components/ProductDeviceFrame';
import type { ProductMediaPlacement } from '@/lib/productMedia';

type TaskFlowScreen = ProductMediaPlacement & Readonly<{
  alt: string;
}>;

type TaskFlowStep = Readonly<{
  kicker: string;
  title: string;
  desc: string;
}>;

type TaskSpatialHandoffProps = Readonly<{
  regionLabel: string;
  selectLabel: string;
  screens: readonly TaskFlowScreen[];
  steps: readonly TaskFlowStep[];
}>;

const FLOW_STEP_COUNT = 3;

export default function TaskSpatialHandoff({
  regionLabel,
  selectLabel,
  screens,
  steps,
}: TaskSpatialHandoffProps) {
  const flowId = useId().replaceAll(':', '');
  const [activeStep, setActiveStep] = useState(0);
  const regionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const sequenceTimers = useRef<number[]>([]);
  const sequenceStarted = useRef(false);
  const userInteracted = useRef(false);
  const pointerStart = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const screenButtons = useRef<Array<HTMLButtonElement | null>>([]);

  const clearSequence = useCallback(() => {
    sequenceTimers.current.forEach((timer) => window.clearTimeout(timer));
    sequenceTimers.current = [];
  }, []);

  const stopSequence = useCallback(() => {
    userInteracted.current = true;
    clearSequence();
  }, [clearSequence]);

  /**
   * On a phone the steps are a native horizontal scroller (the 720px block of
   * page.module.css): the card follows the finger, and the active step is
   * read back from the scroll position. Wider layouts show all three at once.
   */
  const isScroller = useCallback(() => {
    const list = listRef.current;
    return !!list && list.scrollWidth > list.clientWidth + 1;
  }, []);

  const scrollToStep = useCallback((index: number) => {
    const list = listRef.current;
    const item = list?.children[index] as HTMLElement | undefined;
    if (!list || !item) return;
    list.scrollTo({
      left: item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  }, []);

  const selectStep = useCallback((index: number) => {
    stopSequence();
    if (regionRef.current) regionRef.current.scrollLeft = 0;
    const next = (index + FLOW_STEP_COUNT) % FLOW_STEP_COUNT;
    setActiveStep(next);
    if (isScroller()) scrollToStep(next);
  }, [isScroller, scrollToStep, stopSequence]);

  const startSequence = useCallback(() => {
    if (
      sequenceStarted.current ||
      userInteracted.current ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    sequenceStarted.current = true;
    // On a phone each step fills the screen, so it stays long enough to read.
    const scroller = isScroller();
    const show = (index: number) => (scroller ? scrollToStep(index) : setActiveStep(index));
    sequenceTimers.current = scroller
      ? [
        window.setTimeout(() => show(1), 3200),
        window.setTimeout(() => show(2), 6800),
      ]
      : [
        window.setTimeout(() => show(1), 1200),
        window.setTimeout(() => show(2), 2700),
      ];
  }, [isScroller, scrollToStep]);

  // The scroller decides the active step: the card nearest the centre.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    let frame = 0;
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!isScroller()) return;
        const centre = list.scrollLeft + list.clientWidth / 2;
        let nearest = 0;
        let best = Infinity;
        Array.from(list.children).forEach((child, index) => {
          const item = child as HTMLElement;
          const distance = Math.abs(item.offsetLeft + item.offsetWidth / 2 - centre);
          if (distance < best) {
            best = distance;
            nearest = index;
          }
        });
        setActiveStep(nearest);
      });
    };
    // A finger on the scroller is the reader taking over from the sequence.
    const onTouch = () => stopSequence();
    list.addEventListener('scroll', onScroll, { passive: true });
    list.addEventListener('touchstart', onTouch, { passive: true });
    list.addEventListener('wheel', onTouch, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      list.removeEventListener('scroll', onScroll);
      list.removeEventListener('touchstart', onTouch);
      list.removeEventListener('wheel', onTouch);
    };
  }, [isScroller, stopSequence]);

  useEffect(() => {
    const region = regionRef.current;
    if (!region) return undefined;

    if (!('IntersectionObserver' in window)) {
      startSequence();
      return clearSequence;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startSequence();
          observer.disconnect();
        }
      },
      { threshold: 0.32 },
    );
    observer.observe(region);

    return () => {
      observer.disconnect();
      clearSequence();
    };
  }, [clearSequence, startSequence]);

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const focusedIndex = screenButtons.current.indexOf(event.currentTarget);
    const currentIndex = focusedIndex >= 0 ? focusedIndex : activeStep;
    const nextIndex = (
      currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + FLOW_STEP_COUNT
    ) % FLOW_STEP_COUNT;
    selectStep(nextIndex);
    screenButtons.current[nextIndex]?.focus({ preventScroll: true });
  }, [activeStep, selectStep]);

  // The swipe below is for layouts that show all three steps; a phone's
  // scroller swipes natively.
  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' || !event.isPrimary || isScroller()) return;
    stopSequence();
    pointerStart.current = event.clientX;
  }, [isScroller, stopSequence]);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || pointerStart.current === null) return;

    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) < 36) return;

    suppressClick.current = true;
    if (regionRef.current) regionRef.current.scrollLeft = 0;
    setActiveStep((current) => (
      current + (distance > 0 ? -1 : 1) + FLOW_STEP_COUNT
    ) % FLOW_STEP_COUNT);
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 400);
  }, []);

  return (
    <section
      ref={regionRef}
      className={s.taskFlow}
      data-active={activeStep}
      aria-label={regionLabel}
    >
      <span id={`${flowId}-action`} className={s.srOnly}>
        {selectLabel}
      </span>
      <span className={s.taskRelay} aria-hidden="true">
        <Image
          className={s.taskRelayAsset}
          src="/images/brand/golden-relay-flow.png"
          alt=""
          width={2048}
          height={256}
          sizes="(max-width: 720px) 160vw, 1080px"
        />
        <Image
          key={`relay-${activeStep}`}
          className={s.taskRelayResonance}
          src="/images/brand/golden-relay-flow.png"
          alt=""
          width={2048}
          height={256}
          sizes="(max-width: 720px) 160vw, 1080px"
        />
      </span>
      <ol ref={listRef} className={s.taskFlowList}>
        {screens.slice(0, FLOW_STEP_COUNT).map((screen, index) => {
          const step = steps[index];
          const isActive = index === activeStep;
          const titleId = `${flowId}-title-${index}`;
          const descriptionId = `${flowId}-description-${index}`;
          const screenDescriptionId = `${flowId}-screen-${index}`;

          return (
            <li key={screen.id} className={s.taskFlowItem} data-active={isActive}>
              <button
                ref={(element) => {
                  screenButtons.current[index] = element;
                }}
                type="button"
                className={s.taskFlowButton}
                aria-labelledby={`${flowId}-action ${titleId}`}
                aria-describedby={`${descriptionId} ${screenDescriptionId}`}
                aria-pressed={isActive}
                onKeyDown={handleKeyDown}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => {
                  pointerStart.current = null;
                  suppressClick.current = false;
                }}
                onMouseEnter={() => selectStep(index)}
                onFocus={() => selectStep(index)}
                onClick={() => {
                  if (suppressClick.current) return;
                  selectStep(index);
                }}
              >
                <span className={s.taskScreenSlot}>
                  <span className={s.taskScreenPlane}>
                    <ProductDeviceFrame
                      media={screen}
                      alt=""
                      sizes="(max-width: 720px) 66vw, (max-width: 1024px) 24vw, 270px"
                    />
                  </span>
                </span>
                <span id={screenDescriptionId} className={s.srOnly}>
                  {screen.alt}
                </span>
                <span className={s.taskStepCopy}>
                  <span className={s.taskStepKicker}>
                    {String(index + 1).padStart(2, '0')} - {step.kicker}
                  </span>
                  <strong id={titleId}>{step.title}</strong>
                  <span id={descriptionId} className={s.taskStepDescription}>
                    {step.desc}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className={s.taskFlowDots}>
        {steps.slice(0, FLOW_STEP_COUNT).map((step, index) => (
          <button
            key={step.kicker}
            type="button"
            className={s.taskFlowDot}
            aria-label={`${String(index + 1).padStart(2, '0')} - ${step.kicker}`}
            aria-pressed={index === activeStep}
            onClick={() => selectStep(index)}
          />
        ))}
      </div>
    </section>
  );
}
