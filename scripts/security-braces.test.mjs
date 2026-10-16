import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";

const require = createRequire(import.meta.url);
const braces = require("braces");
const micromatch = require("micromatch");
const pattern = (depth, open = "{", close = "}") => open.repeat(depth) + "a,b" + close.repeat(depth);
const controlled = (error) => /^(Input|AST) depth \(.*exceeds max depth/.test(error.message)
  && !/Maximum call stack/.test(error.message);

test("micromatch and installed braces use the reviewed runtime bytes", () => {
  const ownerRequire = createRequire(require.resolve("micromatch/package.json"));
  assert.equal(ownerRequire("braces"), braces);
  const manifest = JSON.parse(readFileSync(new URL("../vendor/braces-backport.json", import.meta.url)));
  for (const [filename, expected] of Object.entries(manifest.files)) {
    const installed = require.resolve(`braces/${filename}`);
    assert.equal(createHash("sha256").update(readFileSync(installed)).digest("hex"), expected, filename);
  }
});

function ast(depth) {
  const root = { type: "root", nodes: [] };
  let parent = root;
  for (let i = 0; i < depth; i++) {
    const node = { type: "paren", parent, nodes: [] };
    parent.nodes.push(node);
    parent = node;
  }
  parent.nodes.push({ type: "text", value: "x", parent });
  return root;
}

test("brace and parenthesis nesting rejects at 101 before recursive walking", { timeout: 5000 }, () => {
  for (const [open, close] of [["{", "}"], ["(", ")"]]) {
    for (const method of ["parse", "compile", "expand", "stringify"]) {
      assert.doesNotThrow(() => braces[method](pattern(100, open, close)));
      for (const depth of [101, 2000]) {
        assert.throws(() => braces[method](pattern(depth, open, close)), controlled, `${method}/${depth}`);
      }
      assert.throws(() => braces[method](pattern(101, open, close), { maxDepth: 1000000 }), controlled);
      assert.throws(() => braces[method](pattern(3, open, close), { maxDepth: 2.5 }), controlled);
      assert.doesNotThrow(() => braces[method](pattern(2, open, close), { maxDepth: 2.5 }));
    }
  }
  assert.throws(() => braces.parse("{(".repeat(51)), controlled);
});

test("all public AST walkers enforce depth for caller-supplied ASTs", { timeout: 5000 }, () => {
  for (const method of ["compile", "expand", "stringify"]) {
    assert.doesNotThrow(() => braces[method](ast(100)));
    for (const depth of [101, 2000]) {
      assert.throws(() => braces[method](ast(depth)), controlled, `${method}/${depth}`);
    }
    assert.throws(() => braces[method](ast(101), { maxDepth: Infinity }), controlled);
    assert.throws(() => braces[method](ast(101), { maxDepth: NaN }), controlled);
    assert.throws(() => braces[method](ast(3), { maxDepth: 2.5 }), controlled);
    const cyclic = { type: "paren", nodes: [] };
    cyclic.nodes.push(cyclic);
    assert.throws(() => braces[method](cyclic), controlled);
  }
  const cyclicParent = { type: "paren", nodes: [] };
  cyclicParent.parent = cyclicParent;
  assert.throws(() => braces.expand(cyclicParent), /AST parent chain contains a cycle/);
});

test("ordinary globs, ranges, escapes and invalid braces retain behavior", () => {
  assert.deepEqual(braces.expand("src/{app,lib}/**/*.{js,ts}"), [
    "src/app/**/*.js", "src/app/**/*.ts", "src/lib/**/*.js", "src/lib/**/*.ts",
  ]);
  assert.equal(braces.compile("a/{b,c}/d"), "a/(b|c)/d");
  assert.deepEqual(braces.expand("file-{01..03}"), ["file-01", "file-02", "file-03"]);
  assert.deepEqual(braces.expand("{a,b}{1,2}"), ["a1", "a2", "b1", "b2"]);
  assert.equal(braces.stringify("{a,b}"), "{a,b}");
  assert.equal(braces.stringify("{abc}", { escapeInvalid: true }), "{abc}");
  assert.equal(braces.stringify("{abc", { escapeInvalid: true }), "{abc");
  assert.equal(braces.stringify({ type: "open", value: "{", invalid: true }, { escapeInvalid: true }), "\\{");
  assert.doesNotThrow(() => braces.compile("\\{".repeat(1000)));
  assert.doesNotThrow(() => braces.compile('"' + "{".repeat(1000) + '"'));
  assert.doesNotThrow(() => braces.compile("[" + "{".repeat(1000) + "]"));
  assert.throws(() => braces.expand("{1..1001}"), /range limit/);
  assert.deepEqual(micromatch(["app/page.tsx", "lib/a.ts", "README.md"], "{app,lib}/**/*.{ts,tsx}"), ["app/page.tsx", "lib/a.ts"]);
  assert.throws(() => micromatch.braces(pattern(2000)), controlled);
});
