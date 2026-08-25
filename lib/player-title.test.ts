import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePlayerTitle, parsePlayerTitleSegments } from "./player-title.ts";

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

test("parses concatenated multi-color font tags (production PRIDE sample)", () => {
  const raw =
    '<font color="#E40204">P</font><font color="#FF8C00">R</font>' +
    '<font color="#FFED00">I</font><font color="#008026">D</font>' +
    '<font color="#AD379D">E</font>';
  const segments = parsePlayerTitleSegments(raw);
  assert.deepEqual(
    segments?.map((s) => s.text),
    ["P", "R", "I", "D", "E"],
  );
  assert.deepEqual(
    segments?.map((s) => s.color),
    ["#E40204", "#FF8C00", "#FFED00", "#008026", "#AD379D"],
  );
  // Multiple distinct colors -> no single color, text is the concatenation.
  assert.deepEqual(parsePlayerTitle(raw), { text: "PRIDE", color: null });
});

test("keeps the color when every segment shares it", () => {
  const raw = '<font color="#b52834">never </font><font color="#b52834">forgives</font>';
  assert.deepEqual(parsePlayerTitle(raw), { text: "never forgives", color: "#b52834" });
});

test("falls back to plain text when markup is mixed with plain text", () => {
  const parsed = parsePlayerTitle('<font color="red">hi</font> there');
  assert.equal(parsed.text, '<font color="red">hi</font> there');
  assert.equal(parsed.color, null);
  assert.equal(parsePlayerTitleSegments('<font color="red">hi</font> there'), null);
});

test("still rejects nested tags inside multi-segment markup", () => {
  const raw =
    '<font color="red"><img src=x onerror=alert(1)>a</font><font color="blue">b</font>';
  assert.equal(parsePlayerTitleSegments(raw), null);
  assert.equal(parsePlayerTitle(raw).color, null);
});
