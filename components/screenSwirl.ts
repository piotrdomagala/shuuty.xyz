// A swirl between two phone screens: the picture on the screen twists into a
// whirl around its middle, turns into the next screen at the peak and
// untwists. Only the screen moves; the phone around it stays still. Plain
// WebGL, one small shader, a canvas laid over the screen for the length of
// the change. Returns false when it cannot run (no WebGL, image not loaded),
// so the caller falls back to a plain cross-fade.

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

export interface SwirlRun {
  done: Promise<void>;
  // Removes the canvas; call it once the new screen is shown underneath.
  remove: () => void;
}

export function swirlScreens(
  fromImage: HTMLImageElement,
  toImage: HTMLImageElement,
  { duration = 1300, delay = 0 }: { duration?: number; delay?: number } = {},
): SwirlRun | null {
  if (!fromImage.complete || !toImage.complete || !fromImage.naturalWidth || !toImage.naturalWidth) return null;
  // The canvas lies in the screen itself, over the picture, at 100% of it:
  // it lines up with the image to the pixel and follows the phone if the
  // phone moves or changes size during the swirl.
  const screen = fromImage.parentElement;
  const width = fromImage.offsetWidth;
  const height = fromImage.offsetHeight;
  if (!screen || !width || !height) return null;

  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '3',
  });
  canvas.setAttribute('aria-hidden', 'true');

  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
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

  const draw = (progress: number) => {
    gl.uniform1f(progressAt, progress);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  draw(0);
  if (getComputedStyle(screen).position === 'static') screen.style.position = 'relative';
  screen.appendChild(canvas);

  let frame = 0;
  const done = new Promise<void>((resolve) => {
    const startAt = performance.now() + delay;
    const step = (now: number) => {
      const linear = Math.min(1, Math.max(0, (now - startAt) / duration));
      // Ease in and out, so the whirl gathers, peaks and settles.
      const eased = linear < 0.5 ? 4 * linear ** 3 : 1 - (-2 * linear + 2) ** 3 / 2;
      draw(eased);
      if (linear < 1) frame = requestAnimationFrame(step);
      else resolve();
    };
    frame = requestAnimationFrame(step);
  });

  return {
    done,
    remove: () => {
      cancelAnimationFrame(frame);
      canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
