// A swirl between two phone screens: the picture on the screen twists into a
// whirl around its middle, turns into the next screen at the peak and
// untwists. Only the screen moves; the phone around it stays still.
//
// Plain WebGL, one small shader. The swirl is drawn on a canvas laid over the
// old screen and mirrored onto a canvas over the new one, so the screens
// underneath can be swapped at the middle of the turn without a seam. The
// first canvas fades in over the old picture and the second fades out over
// the new one, so no edge shows where the WebGL picture and the browser's own
// picture differ a little (sharpness, wide-gamut colour). Returns null when
// it cannot run (no WebGL, image not loaded); the caller then cross-fades.

const VERTEX = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = vec2(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT = `
precision mediump float;
uniform sampler2D from;
uniform sampler2D to;
uniform float progress;
uniform float aspect;
varying vec2 uv;
void main() {
  vec2 center = vec2(0.5, 0.46);
  vec2 d = uv - center;
  d.x *= aspect;
  float r = length(d);
  float peak = sin(progress * 3.14159265);
  // Strongest in the middle of the screen, gone at the edges; the whole
  // picture also draws in a little at the peak.
  float angle = peak * 7.0 * pow(max(0.0, 1.0 - r / 0.85), 2.0);
  float c = cos(angle);
  float s = sin(angle);
  vec2 q = vec2(c * d.x - s * d.y, s * d.x + c * d.y) * (1.0 - 0.12 * peak);
  q.x /= aspect;
  vec2 p = clamp(q + center, 0.0, 1.0);
  vec4 a = texture2D(from, p);
  vec4 b = texture2D(to, p);
  float m = smoothstep(0.38, 0.62, progress);
  vec4 color = mix(a, b, m);
  // A little light at the heart of the whirl.
  color.rgb += peak * 0.18 * pow(max(0.0, 1.0 - r / 0.5), 2.0);
  gl_FragColor = color;
}`;

const FADE_MS = 200;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function texture(gl: WebGLRenderingContext, image: HTMLImageElement): WebGLTexture | null {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  return tex;
}

function overlay(canvas: HTMLCanvasElement, screen: HTMLElement, opacity: string) {
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '3',
    opacity,
    transition: `opacity ${FADE_MS}ms ease`,
  });
  canvas.setAttribute('aria-hidden', 'true');
  if (getComputedStyle(screen).position === 'static') screen.style.position = 'relative';
  screen.appendChild(canvas);
}

export interface SwirlRun {
  // The screens underneath may be swapped from here on: both canvases show
  // the same frame.
  midpoint: Promise<void>;
  done: Promise<void>;
  // Fades the swirl out over the new screen and removes it.
  finish: () => void;
  // Removes everything at once (an abandoned change).
  remove: () => void;
}

export function swirlScreens(
  fromImage: HTMLImageElement,
  toImage: HTMLImageElement,
  { duration = 1300, delay = 0 }: { duration?: number; delay?: number } = {},
): SwirlRun | null {
  if (!fromImage.complete || !toImage.complete || !fromImage.naturalWidth || !toImage.naturalWidth) return null;
  const fromScreen = fromImage.parentElement;
  const toScreen = toImage.parentElement;
  const width = fromImage.offsetWidth;
  const height = fromImage.offsetHeight;
  if (!fromScreen || !toScreen || !width || !height) return null;

  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true, preserveDrawingBuffer: true });
  if (!gl) return null;
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  const fromTex = texture(gl, fromImage);
  gl.activeTexture(gl.TEXTURE1);
  const toTex = texture(gl, toImage);
  if (!fromTex || !toTex) return null;
  gl.uniform1i(gl.getUniformLocation(program, 'from'), 0);
  gl.uniform1i(gl.getUniformLocation(program, 'to'), 1);
  gl.uniform1f(gl.getUniformLocation(program, 'aspect'), width / height);
  const progressAt = gl.getUniformLocation(program, 'progress');
  gl.viewport(0, 0, canvas.width, canvas.height);

  // The mirror over the new screen: a plain 2D canvas that copies each frame.
  const mirror = document.createElement('canvas');
  mirror.width = canvas.width;
  mirror.height = canvas.height;
  const mirrorCtx = mirror.getContext('2d');
  if (!mirrorCtx) return null;

  const draw = (progress: number) => {
    gl.uniform1f(progressAt, progress);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    mirrorCtx.clearRect(0, 0, mirror.width, mirror.height);
    mirrorCtx.drawImage(canvas, 0, 0);
  };
  draw(0);
  overlay(canvas, fromScreen, '0');
  overlay(mirror, toScreen, '1');

  let frame = 0;
  let fadeTimer = 0;
  let reachedMiddle: () => void = () => {};
  const midpoint = new Promise<void>((resolve) => {
    reachedMiddle = resolve;
  });
  const startAt = performance.now() + delay;
  // Fade in over the old picture as the swirl starts.
  const fadeIn = window.setTimeout(() => {
    canvas.style.opacity = '1';
  }, Math.max(0, delay - FADE_MS / 2));
  const done = new Promise<void>((resolve) => {
    const step = (now: number) => {
      const linear = Math.min(1, Math.max(0, (now - startAt) / duration));
      // Ease in and out, so the whirl gathers, peaks and settles.
      const eased = linear < 0.5 ? 4 * linear ** 3 : 1 - (-2 * linear + 2) ** 3 / 2;
      draw(eased);
      if (linear >= 0.5) reachedMiddle();
      if (linear < 1) frame = requestAnimationFrame(step);
      else resolve();
    };
    frame = requestAnimationFrame(step);
  });

  const remove = () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(fadeIn);
    window.clearTimeout(fadeTimer);
    canvas.remove();
    mirror.remove();
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };

  return {
    midpoint,
    done,
    finish: () => {
      mirror.style.opacity = '0';
      fadeTimer = window.setTimeout(remove, FADE_MS + 40);
    },
    remove,
  };
}
