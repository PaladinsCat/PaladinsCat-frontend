import assert from "node:assert/strict";
import test from "node:test";
import { activeNewFeatures, parseNewFeaturesDocument } from "./feature-feed.ts";

test("parses typed entries and rejects malformed records", () => {
  const document = parseNewFeaturesDocument(`---
title: New Features
entries:
  - id: valid-release
    kind: new
    category: stats
    status: released
    targetVersion: v1.2.3
    publishedAt: "2026-09-09T12:00:00Z"
    title: Valid release
    summary: A useful customer-facing change.
  - id: Invalid ID
    kind: new
    category: stats
    status: released
    targetVersion: v1.2.3
    publishedAt: "2026-09-09T12:00:00Z"
    title: Invalid release
    summary: This entry is discarded.
  - id: unsafe-link
    kind: new
    category: stats
    status: upcoming
    targetVersion: Next release
    title: Unsafe link
    summary: Protocol-relative links are discarded.
    href: //example.com
---`);
  assert.deepEqual(document.entries.map((entry) => entry.id), ["valid-release"]);
});

test("keeps upcoming entries and only seven days of released entries", () => {
  const entries = parseNewFeaturesDocument(`---
entries:
  - id: upcoming
    kind: improved
    category: experience
    status: upcoming
    targetVersion: Next release
    title: Upcoming
    summary: Visible before release.
  - id: current
    kind: fixed
    category: analytics
    status: released
    targetVersion: v1.2.3
    publishedAt: "2026-09-08T00:00:00Z"
    title: Current
    summary: Still inside the window.
  - id: expired
    kind: fixed
    category: analytics
    status: released
    targetVersion: v1.2.2
    publishedAt: "2026-09-01T00:00:00Z"
    title: Expired
    summary: Outside the window.
---`).entries;
  assert.deepEqual(activeNewFeatures(entries, new Date("2026-09-10T00:00:00Z")).map((entry) => entry.id), ["upcoming", "current"]);
});
