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

type TaskFlowScreen = Readonly<{
  id: string;
  path: string;
  width: number;
  height: number;
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
  const regionRef = useRef<HTMLDivElement>(null);
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

  const selectStep = useCallback((index: number) => {
    stopSequence();
    if (regionRef.current) regionRef.current.scrollLeft = 0;
    setActiveStep((index + FLOW_STEP_COUNT) % FLOW_STEP_COUNT);
  }, [stopSequence]);

  const startSequence = useCallback(() => {
    if (
      sequenceStarted.current ||
      userInteracted.current ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    sequenceStarted.current = true;
    sequenceTimers.current = [
      window.setTimeout(() => setActiveStep(1), 1200),
      window.setTimeout(() => setActiveStep(2), 2700),
    ];
  }, []);

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

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const focusedIndex = screenButtons.current.findIndex(
      (button) => button === document.activeElement,
    );
    const currentIndex = focusedIndex >= 0 ? focusedIndex : activeStep;
    const nextIndex = (
      currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + FLOW_STEP_COUNT
    ) % FLOW_STEP_COUNT;
    selectStep(nextIndex);
    screenButtons.current[nextIndex]?.focus({ preventScroll: true });
  }, [activeStep, selectStep]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' || !event.isPrimary) return;
    stopSequence();
    pointerStart.current = event.clientX;
  }, [stopSequence]);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
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
    <div
      ref={regionRef}
      className={s.taskFlow}
      data-active={activeStep}
      role="region"
      aria-label={regionLabel}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStart.current = null;
        suppressClick.current = false;
      }}
    >
      <span id={`${flowId}-action`} className={s.srOnly}>
        {selectLabel}
      </span>
      <Image
        className={s.taskRelayAsset}
        src="/images/brand/golden-relay-flow.png"
        alt=""
        width={2048}
        height={256}
        sizes="(max-width: 720px) 160vw, 1080px"
        aria-hidden="true"
      />
      <ol className={s.taskFlowList}>
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
                onMouseEnter={() => selectStep(index)}
                onFocus={() => selectStep(index)}
                onClick={() => {
                  if (suppressClick.current) return;
                  selectStep(index);
                }}
              >
                <span className={s.taskScreenSlot}>
                  <span className={`${s.phone} ${s.taskScreenPlane}`}>
                    <Image
                      src={screen.path}
                      alt={screen.alt}
                      width={screen.width}
                      height={screen.height}
                      draggable={false}
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
    </div>
  );
}
