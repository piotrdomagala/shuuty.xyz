import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const publicDirectory = new URL(
  "public/google-play/foreground-service/microphone/",
  root
);
const videoUrl = new URL(
  "voice-task-fgs-demo-redacted-v6.mp4",
  publicDirectory
);
const pageUrl = new URL("index.html", publicDirectory);
const expectedVideoSha256 =
  "f3b376db323c79f5f79a062be96c442770701cedb19a7d2a5b5662630e518fc4";
const expectedVideoBytes = 1_228_536;

test("hosts the exact privacy-approved FGS v6 video bytes", async () => {
  const [video, metadata] = await Promise.all([
    readFile(videoUrl),
    stat(videoUrl),
  ]);

  assert.equal(metadata.isFile(), true);
  assert.equal(metadata.size, expectedVideoBytes);
  assert.equal(
    createHash("sha256").update(video).digest("hex"),
    expectedVideoSha256
  );
  assert.equal(video.subarray(4, 8).toString("ascii"), "ftyp");
});

test("publishes a crawlable noindex evidence page without external dependencies", async () => {
  const [html, robots, sitemap] = await Promise.all([
    readFile(pageUrl, "utf8"),
    readFile(new URL("public/robots.txt", root), "utf8"),
    readFile(new URL("app/sitemap.ts", root), "utf8"),
  ]);

  assert.match(
    html,
    /<meta name="robots" content="noindex, nofollow, noarchive" \/>/u
  );
  assert.match(
    html,
    /<meta name="googlebot" content="noindex, nofollow, noarchive" \/>/u
  );
  assert.match(
    html,
    /<link\s+rel="canonical"\s+href="https:\/\/shuuty\.com\/google-play\/foreground-service\/microphone\/"/u
  );
  assert.match(
    html,
    /<source src="\.\/voice-task-fgs-demo-redacted-v6\.mp4" type="video\/mp4" \/>/u
  );
  assert.doesNotMatch(html, /\b(?:autoplay|src="https?:|<script)\b/iu);
  assert.doesNotMatch(
    robots,
    /Disallow:\s*\/google-play\/foreground-service\/microphone\//iu
  );
  assert.doesNotMatch(sitemap, /google-play\/foreground-service/iu);
});
