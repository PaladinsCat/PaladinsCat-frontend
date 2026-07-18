import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import ts from "typescript";

const root = resolve(process.cwd());
const sourceDirectories = ["app", "components", "lib"];
const files = [];
const catalogRoot = resolve(root, "lib/localization/catalog");
const modules = JSON.parse(await readFile(resolve(root, "lib/localization/modules.json"), "utf8"));
const catalogKeys = new Set();

for (const module of modules) {
  const messages = JSON.parse(await readFile(join(catalogRoot, `${module}.json`), "utf8"));
  for (const key of Object.keys(messages)) catalogKeys.add(key);
}

async function filesIn(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await filesIn(path);
    else if (/\.tsx?$/.test(entry.name) && !/types\.gen\.ts$/.test(entry.name)) files.push(path);
  }
}

for (const directory of sourceDirectories) await filesIn(resolve(root, directory));

const missing = [];
for (const file of files) {
  const source = ts.createSourceFile(file, await readFile(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["t", "translate"].includes(node.expression.text)) {
      const key = node.arguments[0];
      if (key && ts.isStringLiteralLike(key) && !catalogKeys.has(key.text)) {
        const position = source.getLineAndCharacterOfPosition(key.getStart(source));
        missing.push(`${file.replace(`${root}\\`, "").replaceAll("\\", "/")}:${position.line + 1} ${key.text}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

if (missing.length > 0) {
  console.error("Translation keys used by the frontend are missing from the canonical catalog:");
  for (const finding of missing) console.error(`- ${finding}`);
  process.exitCode = 1;
}
