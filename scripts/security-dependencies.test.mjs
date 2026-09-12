import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

// Exercise the dependency owners used by Next image optimization and content parsing.
const require = createRequire(import.meta.url);
const nextRequire = createRequire(require.resolve("next/package.json"));
const matterRequire = createRequire(require.resolve("gray-matter/package.json"));
const sharp = nextRequire("sharp");
const matter = require("gray-matter");
const semver = require("semver");

test("runtime dependencies include the advisory fixes", () => {
  assert.ok(semver.gte(sharp.versions.sharp, "0.35.4"));
  assert.ok(semver.gte(sharp.versions.heif, "1.23.2"));
  assert.ok(semver.satisfies(matterRequire("js-yaml/package.json").version, ">=3.15.2 <4"));
});

test("build tools resolve patched YAML 4 and reject excessive empty merges", { timeout: 5000 }, () => {
  for (const owner of ["@eslint/eslintrc", "@redocly/openapi-core", "cosmiconfig"]) {
    const ownerRequire = createRequire(require.resolve(owner));
    const yaml = ownerRequire("js-yaml");
    assert.ok(semver.satisfies(ownerRequire("js-yaml/package.json").version, ">=4.3.2 <5"), owner);
    assert.deepEqual(yaml.load("name: check\nenabled: true\n"), { name: "check", enabled: true });
    const small = "arr: &arr [{}, {}, {}, {}]\ntarget:\n  <<: *arr\n";
    assert.throws(() => yaml.load(small, { maxTotalMergeKeys: 3 }), /maxTotalMergeKeys/, owner);
  }
});

test("gray-matter preserves ordinary frontmatter and rejects excessive empty merges", { timeout: 5000 }, () => {
  const ordinary = matter("---\ntitle: Security update\ntags: [news, fixes]\n---\nArticle body");
  assert.deepEqual(ordinary.data, { title: "Security update", tags: ["news", "fixes"] });
  assert.equal(ordinary.content.trim(), "Article body");

  // A tiny explicit budget reproduces GHSA-2883-xcg3-v3hh without a CPU-heavy payload.
  const small = "---\narr: &arr [{}, {}, {}, {}]\ntarget:\n  <<: *arr\n---\nArticle body";
  assert.throws(() => matter(small, { maxTotalMergeKeys: 3 }), /maxTotalMergeKeys/);
});

test("Next optimizes PNG to WebP and retains its AVIF decode block", { timeout: 10000 }, async () => {
  sharp.concurrency(2);
  const source = { create: { width: 8, height: 8, channels: 3, background: "#336699" } };
  const png = await sharp(source).png().toBuffer();
  const avif = await sharp(source).avif().toBuffer();
  const { getSharp, optimizeImage } = nextRequire("next/dist/server/image-optimizer");
  const optimizerSharp = getSharp(2);
  assert.equal(optimizerSharp, sharp);
  const result = await optimizeImage({
    buffer: png, contentType: "image/webp", quality: 75, width: 4,
    concurrency: 2, timeoutInSeconds: 5,
  });
  const metadata = await sharp(result).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 4);
  assert.equal(metadata.height, 4);
  await assert.rejects(() => optimizerSharp(avif).metadata(), /blocked|unsupported/i);
});
