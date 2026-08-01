import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const images = await Promise.all(
  [
    ['public/favicon-16x16.png', 16],
    ['public/favicon-32x32.png', 32],
    ['public/android-chrome-192x192.png', 192],
  ].map(async ([path, size]) => ({
    data: await readFile(new URL(path, root)),
    size,
  })),
);

const directorySize = 6 + images.length * 16;
const totalSize = directorySize + images.reduce((sum, image) => sum + image.data.length, 0);
const favicon = Buffer.alloc(totalSize);

favicon.writeUInt16LE(0, 0);
favicon.writeUInt16LE(1, 2);
favicon.writeUInt16LE(images.length, 4);

let imageOffset = directorySize;
images.forEach((image, index) => {
  const entryOffset = 6 + index * 16;
  favicon.writeUInt8(image.size === 256 ? 0 : image.size, entryOffset);
  favicon.writeUInt8(image.size === 256 ? 0 : image.size, entryOffset + 1);
  favicon.writeUInt8(0, entryOffset + 2);
  favicon.writeUInt8(0, entryOffset + 3);
  favicon.writeUInt16LE(1, entryOffset + 4);
  favicon.writeUInt16LE(32, entryOffset + 6);
  favicon.writeUInt32LE(image.data.length, entryOffset + 8);
  favicon.writeUInt32LE(imageOffset, entryOffset + 12);
  image.data.copy(favicon, imageOffset);
  imageOffset += image.data.length;
});

await writeFile(new URL('app/favicon.ico', root), favicon);
console.log('Generated a multi-size favicon.ico from the existing Shuuty icon assets.');
