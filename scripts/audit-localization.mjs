import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(process.cwd());
const sourceDirectories = ["app", "components"];
const translatableAttributes = new Set(["alt", "aria-label", "placeholder", "title"]);
const findings = [];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return filesIn(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

function addFinding(source, node, text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!/[A-Za-z]/.test(normalized) || normalized.length < 2) return;
  const position = source.getLineAndCharacterOfPosition(node.getStart(source));
  findings.push({
    file: source.fileName.replace(`${root}\\`, "").replaceAll("\\", "/"),
    line: position.line + 1,
    text: normalized,
  });
}

for (const directory of sourceDirectories) {
  for (const file of await filesIn(resolve(root, directory))) {
    const source = ts.createSourceFile(file, await readFile(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node) => {
      if (ts.isJsxText(node)) addFinding(source, node, node.getText(source));

      if (ts.isJsxAttribute(node) && translatableAttributes.has(node.name.text)) {
        const value = node.initializer;
        if (value && ts.isStringLiteral(value)) addFinding(source, value, value.text);
      }

      ts.forEachChild(node, visit);
    };
    visit(source);
  }
}

const uniqueText = new Set(findings.map(({ text }) => text));
console.log(`${findings.length} hardcoded UI-text occurrences (${uniqueText.size} unique strings).`);
for (const finding of findings) {
  console.log(`${finding.file}:${finding.line}  ${finding.text}`);
}

if (process.argv.includes("--strict") && findings.length > 0) process.exitCode = 1;
