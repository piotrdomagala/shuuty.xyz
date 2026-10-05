'use client';

import { useEffect, useRef, type RefObject } from 'react';

// A soft stream of smoke in the colour of the place shown in the headline
// (on your own, with friends, in groups): it rises from under the word and
// drifts to the phones, with a few sparks travelling in it. When the place
// changes, the old word breaks into dust of its own colour and the new smoke
// starts from the new word. Plain canvas 2D with pre-rendered soft sprites,
// additive light on the dark theme. It runs only while the hero is on screen
// and the tab is visible, and not at all with reduced motion.

type Rgb = readonly [number, number, number];

interface HeroSmokeProps {
  // Element whose children are the three words; the shown one has [data-active].
  sourceRef: RefObject<HTMLElement | null>;
  targetRef: RefObject<HTMLElement | null>;
  // The step colours of the three places, for the dark and the light theme.
  colors: Readonly<{ dark: readonly Rgb[]; light: readonly Rgb[] }>;
  active: number;
  className?: string;
}

interface Puff {
  t: number; // 0..1 along the path
  speed: number; // path units per second
  offset: number; // start position across the word, -0.5..0.5
  drift: number;
  phase: number;
  size: number;
  color: number; // the place it belongs to, which also sets its kind of smoke
  alpha: number;
  strand: number; // which thread of the spiral, 0..strands-1
  spark: boolean;
  // Where it left the word: smoke already on its way keeps its own start
  // when the headline changes to the next place.
  sx: number;
  sy: number;
  spread: number;
  base: number;
}

interface Dust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // seconds left
  total: number;
  size: number;
  color: number;
  spark: boolean;
}

// Every place travels as a spiral, the motif of the whole hero: on your own
// and with friends two threads winding round each other (gold, then blue),
// in groups three threads in a breathing cloud.
const STYLES = [
  { rate: 50, speed: [0.17, 0.25], spread: 0.4, size: 0.75, wander: 6, helix: 32, strands: 2, billow: 0, sparks: 10 },
  { rate: 50, speed: [0.18, 0.26], spread: 0.4, size: 0.75, wander: 6, helix: 36, strands: 2, billow: 0, sparks: 8 },
  { rate: 60, speed: [0.14, 0.22], spread: 0.8, size: 0.95, wander: 12, helix: 40, strands: 3, billow: 1, sparks: 9 },
] as const;

const MAX_PUFFS = 300;

// The smoke only needs varied numbers, never secure ones: a small seeded
// generator (mulberry32) keeps it independent of Math.random.
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SPRITE_SIZE = 128;

function makeSprite([r, g, b]: Rgb, spark: boolean): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  sprite.width = SPRITE_SIZE;
  sprite.height = SPRITE_SIZE;
  const ctx = sprite.getContext('2d');
  if (!ctx) return sprite;
  const half = SPRITE_SIZE / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  if (spark) {
    // A bright core that turns into the colour: a small light, not a blob.
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.12, `rgba(${r}, ${g}, ${b}, 0.9)`);
    gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.18)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  } else {
    // A near-gaussian falloff, so many soft puffs blend into one smoke.
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.42)`);
    gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, 0.32)`);
    gradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.13)`);
    gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.04)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return sprite;
}

const bezier = (a: number, c: number, b: number, t: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

export default function HeroSmoke({ sourceRef, targetRef, colors, active, className }: Readonly<HeroSmokeProps>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef(active);
  const changeRef = useRef<{ from: number } | null>(null);

  useEffect(() => {
    if (activeRef.current !== active) changeRef.current = { from: activeRef.current };
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sprites = {
      dark: colors.dark.map((color) => makeSprite(color, false)),
      light: colors.light.map((color) => makeSprite(color, false)),
      darkSpark: colors.dark.map((color) => makeSprite(color, true)),
      lightSpark: colors.light.map((color) => makeSprite(color, true)),
    };
    const random = makeRandom(0x5ead5);
    const puffs: Puff[] = [];
    const dust: Dust[] = [];
    let frame = 0;
    let previous = performance.now();
    let onScreen = false;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let sparkDebt = 0;
    let puffDebt = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    const spawn = (count: number, spark: boolean, sx: number, sy: number, wordWidth: number, base: number) => {
      const place = activeRef.current;
      const style = STYLES[place] ?? STYLES[0];
      for (let i = 0; i < count && puffs.length < MAX_PUFFS; i += 1) {
        puffs.push({
          t: random() * 0.05,
          speed: (style.speed[0] + random() * (style.speed[1] - style.speed[0])) * (spark ? 1.25 : 1),
          offset: random() - 0.5,
          drift: (random() - 0.5) * 2,
          phase: random() * Math.PI * 2,
          size: (spark ? 0.22 + random() * 0.2 : 0.6 + random() * 0.8) * style.size,
          color: place,
          alpha: spark ? 0.8 + random() * 0.2 : 0.45 + random() * 0.55,
          strand: Math.floor(random() * style.strands),
          spark,
          sx,
          sy,
          spread: wordWidth * style.spread,
          base,
        });
      }
    };

    // The old word breaks into dust of its colour that drifts up and away.
    const dissolve = (rect: DOMRect, box: DOMRect, color: number) => {
      for (let i = 0; i < 70; i += 1) {
        const spark = i % 5 === 0;
        const total = 0.9 + random() * 0.9;
        dust.push({
          x: rect.left - box.left + random() * rect.width,
          y: rect.top - box.top + rect.height * (0.25 + random() * 0.6),
          vx: (random() - 0.5) * 70,
          vy: -20 - random() * 60,
          life: total,
          total,
          size: spark ? 10 + random() * 10 : 26 + random() * 40,
          color,
          spark,
        });
      }
    };

    const tick = (now: number) => {
      const seconds = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      frame = 0;
      const words = sourceRef.current;
      const source = words?.querySelector<HTMLElement>('[data-active]') ?? null;
      const target = targetRef.current;
      if (!words || !source || !target) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const box = canvas.getBoundingClientRect();
      const s = source.getBoundingClientRect();
      const g = target.getBoundingClientRect();

      const change = changeRef.current;
      if (change) {
        changeRef.current = null;
        const old = words.children[change.from] as HTMLElement | undefined;
        if (old) dissolve(old.getBoundingClientRect(), box, change.from);
      }

      // From under the word to the top of the phones. Side by side the stream
      // bends up and over; stacked (phone layout) it falls down.
      const wordX = s.left - box.left + s.width / 2;
      const wordY = s.bottom - box.top - s.height * 0.12;
      const tx = g.left - box.left + g.width / 2;
      const ty = g.top - box.top + g.height * 0.2;
      const stacked = g.top >= s.bottom;
      const lift = s.height * 0.6;
      const style = STYLES[activeRef.current] ?? STYLES[0];
      const base = Math.max(22, Math.min(56, s.height * 0.75));

      // Carry the fraction between frames, so the rate is per second and not
      // per frame (a 120 Hz screen would otherwise emit twice as much).
      puffDebt += seconds * style.rate;
      if (puffDebt >= 1) {
        spawn(Math.floor(puffDebt), false, wordX, wordY, s.width, base);
        puffDebt -= Math.floor(puffDebt);
      }
      sparkDebt += seconds * style.sparks;
      if (sparkDebt >= 1) {
        spawn(Math.floor(sparkDebt), true, wordX, wordY, s.width, base);
        sparkDebt -= Math.floor(sparkDebt);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const light = document.documentElement.dataset.theme === 'light';
      const smoke = light ? sprites.light : sprites.dark;
      const sparks = light ? sprites.lightSpark : sprites.darkSpark;
      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';

      for (let i = puffs.length - 1; i >= 0; i -= 1) {
        const p = puffs[i];
        p.t += p.speed * seconds;
        if (p.t >= 1) {
          puffs.splice(i, 1);
          continue;
        }
        const t = p.t;
        const kind = STYLES[p.color] ?? STYLES[0];
        const cx = stacked ? p.sx + (tx - p.sx) * 0.15 : p.sx + (tx - p.sx) * 0.55;
        const cy = stacked ? p.sy + (ty - p.sy) * 0.55 : Math.min(p.sy, ty) - lift;
        // Leaving the word the stream is as wide as the word; it narrows on
        // the way and swells into a cloud around the phones.
        const across = p.offset * p.spread * (1 - t) * (1 - t);
        const a = now / 900 + p.phase + t * 6;
        const wander = (Math.sin(a) + 0.45 * Math.sin(2.3 * a + p.phase)) * kind.wander * t
          + p.drift * kind.wander * 1.4 * t * t;
        // The threads wind round the path, evenly spaced around it.
        const helix = kind.helix
          * Math.sin(t * Math.PI * 3 + now / 650 + (p.strand * 2 * Math.PI) / kind.strands)
          * Math.sin(t * Math.PI);
        const x = bezier(p.sx + across, cx, tx, t) + wander + (stacked ? helix : 0);
        const y = bezier(p.sy, cy, ty, t) + Math.cos(now / 1100 + p.phase) * 9 * t + (stacked ? 0 : helix);
        // Rises fast, holds, and lets go only around the phones, so the cloud
        // arrives. Stacked, it stays faint while it passes the text.
        const fade = Math.min(1, t * 7) * (1 - t * t * t);
        const overText = stacked ? 0.3 + 0.7 * Math.min(1, Math.max(0, (t - 0.3) / 0.35)) : 1;
        if (p.spark) {
          const twinkle = 0.55 + 0.45 * Math.sin(now / 120 + p.phase * 7);
          const size = p.base * p.size * (1 + t * 0.6);
          ctx.globalAlpha = p.alpha * fade * twinkle * overText * (light ? 0.55 : 1);
          ctx.drawImage(sparks[p.color] ?? sparks[0], x - size / 2, y - size / 2, size, size);
        } else {
          // In groups the puffs breathe as they go.
          const breathe = kind.billow ? 1 + 0.22 * Math.sin(now / 520 + p.phase * 3) : 1;
          const size = p.base * p.size * (0.7 + t * 3.6) * breathe;
          ctx.globalAlpha = p.alpha * fade * overText * (light ? 0.42 : 0.62);
          ctx.drawImage(smoke[p.color] ?? smoke[0], x - size / 2, y - size / 2, size, size);
        }
      }

      for (let i = dust.length - 1; i >= 0; i -= 1) {
        const d = dust[i];
        d.life -= seconds;
        if (d.life <= 0) {
          dust.splice(i, 1);
          continue;
        }
        d.x += d.vx * seconds;
        d.y += d.vy * seconds;
        d.vx *= 0.985;
        d.vy *= 0.985;
        const k = d.life / d.total;
        const size = d.size * (1.6 - k * 0.6);
        ctx.globalAlpha = k * k * (d.spark ? 1 : 0.55) * (light ? 0.5 : 1);
        const sprite = d.spark ? sparks[d.color] ?? sparks[0] : smoke[d.color] ?? smoke[0];
        ctx.drawImage(sprite, d.x - size / 2, d.y - size / 2, size, size);
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
