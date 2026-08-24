import assert from 'node:assert/strict';
import test from 'node:test';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeStaticSegmentPaths } from './normalize-static-segment-paths.mjs';

test('Windows-style nested segment cache paths become portable flat files', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'shuuty-static-segments-'));

  try {
    const routeDirectory = join(fixture, 'pl', 'support');
    const nestedDirectory = join(routeDirectory, '__next.pl', 'support');
    await mkdir(nestedDirectory, { recursive: true });
    await writeFile(join(nestedDirectory, '__PAGE__.txt'), 'segment payload');

    assert.equal(await normalizeStaticSegmentPaths(fixture), 1);
    assert.equal(
      await readFile(join(routeDirectory, '__next.pl.support.__PAGE__.txt'), 'utf8'),
      'segment payload',
    );
    await assert.rejects(access(join(routeDirectory, '__next.pl')), { code: 'ENOENT' });
    assert.equal(await normalizeStaticSegmentPaths(fixture), 0);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test('normalization refuses to overwrite an existing portable segment file', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'shuuty-static-segments-conflict-'));

  try {
    const routeDirectory = join(fixture, 'support');
    const nestedDirectory = join(routeDirectory, '__next.support');
    await mkdir(nestedDirectory, { recursive: true });
    await writeFile(join(nestedDirectory, '__PAGE__.txt'), 'nested payload');
    await writeFile(
      join(routeDirectory, '__next.support.__PAGE__.txt'),
      'existing payload',
    );

    await assert.rejects(
      normalizeStaticSegmentPaths(fixture),
      /Refusing to overwrite static segment file/u,
    );
    assert.equal(
      await readFile(join(routeDirectory, '__next.support.__PAGE__.txt'), 'utf8'),
      'existing payload',
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
