'use client';

import { useEffect, useRef, type RefObject } from 'react';

// A soft stream of smoke in the colour of the place shown in the headline
// (on your own, with friends, in groups): it rises from under the word and
// drifts to the phones. Plain canvas 2D, one pre-rendered soft sprite per
// colour, drawn with additive light on the dark theme. It runs only while the
// hero is on screen and the tab is visible, and not at all with reduced motion.

type Rgb = readonly [number, number, number];

interface HeroSmokeProps {
  // Element whose active child ([data-active]) is the source word.
  sourceRef: RefObject<HTMLElement | null>;
  targetRef: RefObject<HTMLElement | null>;
  // The step colours of the three places, for the dark and the light theme.
  colors: Readonly<{ dark: readonly Rgb[]; light: readonly Rgb[] }>;
  active: number;
  className?: string;
}

interface Particle {
  t: number; // 0..1 along the path
  speed: number; // path units per second
  offset: number; // start position across the word, -0.5..0.5
  drift: number; // sideways wander
  phase: number;
  size: number;
  color: number; // the place it belongs to, which also sets its kind of smoke
  alpha: number;
  strand: number; // -1 or 1: which of the two threads (with friends)
  // Where it left the word: smoke already on its way keeps its own start
  // when the headline changes to the next place.
  sx: number;
  sy: number;
  spread: number;
  base: number;
}

// A different smoke for each place: on your own one calm thin wisp, with
// friends two threads winding round each other, in groups a wide, billowing
// cloud of many puffs.
const STYLES = [
  { rate: 30, speed: [0.17, 0.25], spread: 0.35, size: 0.9, wander: 12, helix: 0, billow: 0 },
  { rate: 38, speed: [0.19, 0.28], spread: 0.45, size: 0.95, wander: 8, helix: 34, billow: 0 },
  { rate: 52, speed: [0.13, 0.22], spread: 1.1, size: 1.3, wander: 30, helix: 0, billow: 1 },
] as const;

const MAX_PARTICLES = 220;
const SPRITE_SIZE = 128;

function makeSprite([r, g, b]: Rgb): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  sprite.width = SPRITE_SIZE;
  sprite.height = SPRITE_SIZE;
  const ctx = sprite.getContext('2d');
  if (!ctx) return sprite;
  const half = SPRITE_SIZE / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.55)`);
  gradient.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.24)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return sprite;
}

const bezier = (a: number, c: number, b: number, t: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

export default function HeroSmoke({ sourceRef, targetRef, colors, active, className }: Readonly<HeroSmokeProps>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef(active);
  const burstRef = useRef(0);

  useEffect(() => {
    if (activeRef.current !== active) burstRef.current = 26;
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const spriteSets = { dark: colors.dark.map(makeSprite), light: colors.light.map(makeSprite) };
    const particles: Particle[] = [];
    let frame = 0;
    let previous = performance.now();
    let onScreen = false;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    const spawn = (count: number, sx: number, sy: number, wordWidth: number, base: number) => {
      const place = activeRef.current;
      const style = STYLES[place] ?? STYLES[0];
      for (let i = 0; i < count && particles.length < MAX_PARTICLES; i += 1) {
        particles.push({
          t: Math.random() * 0.06,
          speed: style.speed[0] + Math.random() * (style.speed[1] - style.speed[0]),
          offset: Math.random() - 0.5,
          drift: (Math.random() - 0.5) * 2,
          phase: Math.random() * Math.PI * 2,
          size: (0.7 + Math.random() * 0.8) * style.size,
          color: place,
          alpha: 0.5 + Math.random() * 0.5,
          strand: Math.random() < 0.5 ? -1 : 1,
          sx,
          sy,
          spread: wordWidth * style.spread,
          base,
        });
      }
    };

    const tick = (now: number) => {
      const seconds = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      frame = 0;
      const source = sourceRef.current?.querySelector<HTMLElement>('[data-active]') ?? null;
      const target = targetRef.current;
      if (!source || !target) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const box = canvas.getBoundingClientRect();
      const s = source.getBoundingClientRect();
      const g = target.getBoundingClientRect();
      // From under the word to the middle of the phones. Side by side the
      // stream bends up and over; stacked (phone layout) it falls down.
      const wordX = s.left - box.left + s.width / 2;
      const wordY = s.bottom - box.top - s.height * 0.12;
      const tx = g.left - box.left + g.width / 2;
      const ty = g.top - box.top + g.height * 0.2;
      const stacked = g.top >= s.bottom;
      const lift = s.height * 0.6;
      const style = STYLES[activeRef.current] ?? STYLES[0];
      const base = Math.max(26, Math.min(70, s.height * 0.9));

      spawn(
        Math.ceil(seconds * style.rate) + (burstRef.current > 0 ? 3 : 0),
        wordX,
        wordY,
        s.width,
        base,
      );
      if (burstRef.current > 0) burstRef.current -= 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const light = document.documentElement.dataset.theme === 'light';
      const sprites = light ? spriteSets.light : spriteSets.dark;
      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.t += p.speed * seconds;
        if (p.t >= 1) {
          particles.splice(i, 1);
          continue;
        }
        const t = p.t;
        const kind = STYLES[p.color] ?? STYLES[0];
        const cx = stacked ? p.sx + (tx - p.sx) * 0.15 : p.sx + (tx - p.sx) * 0.55;
        const cy = stacked ? p.sy + (ty - p.sy) * 0.55 : Math.min(p.sy, ty) - lift;
        // Leaving the word the stream is as wide as the word; it narrows on
        // the way and swells into a cloud around the phones.
        const across = p.offset * p.spread * (1 - t) * (1 - t);
        const wander = Math.sin(now / 900 + p.phase + t * 6) * kind.wander * t + p.drift * kind.wander * 1.5 * t * t;
        // With friends: two threads that wind round each other.
        const helix = kind.helix * p.strand * Math.sin(t * Math.PI * 3 + now / 700) * Math.sin(t * Math.PI);
        const x = bezier(p.sx + across, cx, tx, t) + wander + (stacked ? helix : 0);
        const y = bezier(p.sy, cy, ty, t) + Math.cos(now / 1100 + p.phase) * 10 * t + (stacked ? 0 : helix);
        // In groups the puffs breathe as they go.
        const breathe = kind.billow ? 1 + 0.25 * Math.sin(now / 500 + p.phase * 3) : 1;
        const size = p.base * p.size * (0.7 + t * 3.4) * breathe;
        // Rises fast, holds, and lets go only around the phones, so the cloud
        // arrives. Stacked, it stays faint while it passes the text.
        const fade = Math.min(1, t * 6) * (1 - t * t * t);
        const overText = stacked ? 0.35 + 0.65 * Math.min(1, Math.max(0, (t - 0.3) / 0.35)) : 1;
        ctx.globalAlpha = p.alpha * fade * overText * (light ? 0.5 : 0.9);
        ctx.drawImage(sprites[p.color] ?? sprites[0], x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      if (onScreen && document.visibilityState === 'visible') frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frame || reduced.matches || !onScreen || document.visibilityState !== 'visible') return;
      previous = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    observer.observe(canvas);
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());
    document.addEventListener('visibilitychange', onVisibility);
    const onReduced = () => {
      if (reduced.matches) {
        stop();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else start();
    };
    reduced.addEventListener('change', onReduced);

    return () => {
      stop();
      resizeObserver.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      reduced.removeEventListener('change', onReduced);
    };
  }, [colors, sourceRef, targetRef]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
