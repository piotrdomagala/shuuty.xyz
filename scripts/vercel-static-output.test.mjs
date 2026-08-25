import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import nextConfig from '../next.config.mjs';

const root = new URL('../', import.meta.url);

test('Vercel publishes the validated static export', async () => {
  const vercelConfig = JSON.parse(
    await readFile(new URL('vercel.json', root), 'utf8'),
  );

  assert.deepEqual(vercelConfig, {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    framework: null,
    buildCommand: 'npm run build',
    outputDirectory: 'out',
    trailingSlash: true,
  });

  assert.equal(nextConfig.output, 'export');
  assert.equal(nextConfig.trailingSlash, true);
});
