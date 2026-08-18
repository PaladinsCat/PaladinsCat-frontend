import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePlayerTitle } from "./player-title.ts";

test("parses a double-quoted hex color title (production sample)", () => {
  const parsed = parsePlayerTitle('<font color="#b52834">never forgives, never forgets</font>');
  assert.equal(parsed.text, "never forgives, never forgets");
  assert.equal(parsed.color, "#b52834");
});

test("parses single-quoted and bare color values", () => {
  assert.deepEqual(parsePlayerTitle("<font color='#ff0000'>a</font>"), {
    text: "a",
    color: "#ff0000",
  });
  assert.deepEqual(parsePlayerTitle("<font color=red>b</font>"), { text: "b", color: "red" });
});

test("parses 3/4/8-digit hex colors", () => {
  assert.equal(parsePlayerTitle('<font color="#abc">x</font>').color, "#abc");
  assert.equal(parsePlayerTitle('<font color="#abcd">x</font>').color, "#abcd");
  assert.equal(parsePlayerTitle('<font color="#aabbccdd">x</font>').color, "#aabbccdd");
});

test("rejects non-CSS hex lengths (5 digits)", () => {
  assert.equal(parsePlayerTitle('<font color="#abcde">x</font>').color, null);
});

test("plain text titles pass through without a color", () => {
  assert.deepEqual(parsePlayerTitle("just a title"), { text: "just a title", color: null });
  assert.deepEqual(parsePlayerTitle(""), { text: "", color: null });
});

test("rejects markup that is not a single well-formed font tag", () => {
  assert.deepEqual(parsePlayerTitle("<font color='#b52834'>unclosed"), {
    text: "<font color='#b52834'>unclosed",
    color: null,
  });
  assert.deepEqual(parsePlayerTitle('<b>bold</b>'), { text: "<b>bold</b>", color: null });
});

test("rejects nested tags inside the font tag", () => {
  const parsed = parsePlayerTitle('<font color="red"><img src=x onerror=alert(1)>x</font>');
  assert.equal(parsed.color, null);
});

test("rejects color values that are not colors", () => {
  const parsed = parsePlayerTitle('<font color="javascript:alert(1)">x</font>');
  assert.equal(parsed.text, "x");
  assert.equal(parsed.color, null);
});

test("trims surrounding whitespace and newlines", () => {
  assert.deepEqual(parsePlayerTitle('  <font color="red">hi</font>\n'), {
    text: "hi",
    color: "red",
  });
});
