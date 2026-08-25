import { access, readdir, rename, rmdir } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

async function findSegmentDirectories(directory) {
  const results = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const entryPath = join(directory, entry.name);
    if (entry.name.startsWith('__next.')) {
      results.push(entryPath);
      continue;
    }

    results.push(...(await findSegmentDirectories(entryPath)));
  }

  return results;
}

async function findFiles(directory) {
  const results = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findFiles(entryPath)));
    } else if (entry.isFile()) {
      results.push(entryPath);
    } else {
      throw new Error(`Unsupported static segment entry: ${entryPath}`);
    }
  }

  return results;
}

async function removeEmptyDirectoryTree(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      throw new Error(`Static segment directory is not empty: ${directory}`);
    }
    await removeEmptyDirectoryTree(join(directory, entry.name));
  }

  await rmdir(directory);
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

export function flattenedSegmentFilename(segmentDirectory, nestedFile) {
  const relativeFile = relative(segmentDirectory, nestedFile);
  return [
    segmentDirectory.split(sep).at(-1),
    ...relativeFile.split(sep),
  ].join('.');
}

export async function normalizeStaticSegmentPaths(outputDirectory) {
  const outputPath = resolve(outputDirectory);
  const segmentDirectories = await findSegmentDirectories(outputPath);
  let normalizedFiles = 0;

  for (const segmentDirectory of segmentDirectories) {
    const routeDirectory = dirname(segmentDirectory);
    const nestedFiles = await findFiles(segmentDirectory);

    for (const nestedFile of nestedFiles) {
      if (!nestedFile.endsWith('.txt')) {
        throw new Error(`Unexpected static segment file: ${nestedFile}`);
      }

      const destination = join(
        routeDirectory,
        flattenedSegmentFilename(segmentDirectory, nestedFile),
      );
      if (await pathExists(destination)) {
        throw new Error(`Refusing to overwrite static segment file: ${destination}`);
      }

      await rename(nestedFile, destination);
      normalizedFiles += 1;
    }

    await removeEmptyDirectoryTree(segmentDirectory);
  }

  return normalizedFiles;
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (executedPath === import.meta.url) {
  const normalizedFiles = await normalizeStaticSegmentPaths(
    fileURLToPath(new URL('../out/', import.meta.url)),
  );
  console.log(
    normalizedFiles > 0
      ? `Normalized ${normalizedFiles} static segment cache files.`
      : 'Static segment cache paths already use portable filenames.',
  );
}
