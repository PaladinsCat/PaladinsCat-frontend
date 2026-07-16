import { readdir, readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import ts from "typescript";

const root = resolve(process.cwd());
// BLIND SPOTS: lib/, app/blog/, lib/blog*.ts, src/
const sourceDirectories = [
  "app/blog",
  "lib",
];

function isTsFile(name) {
  return /\.(tsx?|mts?)$/.test(name) && !/types\.gen\./.test(name);
}

async function filesIn(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".next") {
        return filesIn(path);
      }
      return isTsFile(entry.name) ? [path] : [];
    }));
    return nested.flat();
  } catch {
    return [];
  }
}

// --- Detection (same logic as audit script) ---

function normalizedText(value) {
  return value
    .replaceAll("&amp;", "&").replaceAll("&apos;", "'").replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<").replaceAll("&gt;", ">")
    .replace(/&#(\d+);/g, (_m, c) => String.fromCodePoint(Number(c)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, c) => String.fromCodePoint(Number.parseInt(c, 16)))
    .replace(/\s+/g, " ").trim();
}

function isUiText(value) {
  return /[A-Za-z]/.test(value) && value.length >= 2;
}

function isTranslationCall(node) {
  let current = node;
  while (current?.parent && !ts.isJsxExpression(current.parent) && !ts.isPropertyAssignment(current.parent)) {
    if (ts.isCallExpression(current.parent) && ts.isIdentifier(current.parent.expression) &&
        ["t", "translate"].includes(current.parent.expression.text) &&
        current.parent.arguments[0] === current) return true;
    current = current.parent;
  }
  return false;
}

const findings = [];
const findingsByFile = new Map();
const translatableAttrs = new Set(["alt", "aria-label", "description", "label", "message", "placeholder", "text", "title"]);
const translatableProps = /^(?:ariaLabel|caption|description|empty(?:Label|Message|Text)?|heading|label|message|placeholder|subtitle|title|tooltip)$/i;

for (const dir of sourceDirectories) {
  const dirPath = resolve(root, dir);
  const allFiles = await filesIn(dirPath);

  for (const file of allFiles) {
    const input = await readFile(file, "utf8");
    const rel = relative(root, file).replaceAll("\\", "/");
    const source = ts.createSourceFile(file, input, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    function addFinding(node, text, kind) {
      const norm = normalizedText(text);
      if (!isUiText(norm)) return;
      if (isTranslationCall(node)) return; // already wrapped in t()/translate()
      const pos = source.getLineAndCharacterOfPosition(node.getStart(source));
      findings.push({ file: rel, line: pos.line + 1, kind, text: norm });
    }

    function visit(node) {
      // JSX text children
      if (ts.isJsxText(node)) {
        const text = normalizedText(node.getText(source));
        if (isUiText(text) && !/^\s*$/.test(text)) addFinding(node, text, "jsx-text");
      }

      // JSX attributes
      if (ts.isJsxAttribute(node)) {
        if (translatableAttrs.has(node.name.text) && node.initializer?.kind === ts.SyntaxKind.StringLiteral) {
          addFinding(node.initializer, node.initializer.text, `attr:${node.name.text}`);
        }
      }

      // Object property assignments (e.g. { title: "Blog Post" })
      if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) &&
          translatableProps.test(node.name.text)) {
        if (node.initializer?.kind === ts.SyntaxKind.StringLiteral) {
          addFinding(node.initializer, node.initializer.text, `prop:${node.name.text}`);
        }
      }

      // alert(), confirm(), Error() messages
      if (ts.isCallExpression(node)) {
        if (ts.isIdentifier(node.expression) && ["alert", "confirm"].includes(node.expression.text) &&
            node.arguments[0]?.kind === ts.SyntaxKind.StringLiteral) {
          addFinding(node.arguments[0], node.arguments[0].text, "alert/confirm");
        }
      }
      if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Error" &&
          node.arguments?.[0]?.kind === ts.SyntaxKind.StringLiteral) {
        addFinding(node.arguments[0], node.arguments[0].text, "Error message");
      }

      ts.forEachChild(node, visit);
    }

    visit(source);
  }
}

// Deduplicate by file+line+text
const unique = new Map();
for (const f of findings) {
  const key = `${f.file}:${f.line}:${f.text}`;
  if (!unique.has(key)) unique.set(key, f);
}

const deduped = [...unique.values()].sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

console.log(`=== BLIND SPOT AUDIT ===`);
console.log(`Scanned: ${sourceDirectories.join(", ")}`);
console.log(`Hardcoded strings found: ${deduped.length}\n`);

if (deduped.length === 0) {
  console.log("No hardcoded text found in blind spots.");
} else {
  // Group by file
  const byFile = new Map();
  for (const f of deduped) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }

  for (const [file, items] of byFile) {
    console.log(`\n--- ${file} (${items.length} issues) ---`);
    for (const item of items) {
      console.log(`  L${item.line} [${item.kind}] "${item.text}"`);
    }
  }
}