import crypto from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import ts from "typescript";

const root = resolve(process.cwd());
const sourceDirectories = ["app", "components"];
const catalogFile = resolve(root, "lib/localization/catalog/generated/ui.json");
const translatableAttributes = new Set(["alt", "aria-label", "description", "label", "message", "placeholder", "text", "title"]);
const generated = JSON.parse(await readFile(catalogFile, "utf8"));
const keyOwners = new Map(Object.entries(generated).map(([key, value]) => [key, value]));
const textKeys = new Map();

function normalizedText(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&apos;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function isUiText(value) {
  return /[A-Za-z]/.test(value) && value.length >= 2;
}

function domainFor(file) {
  const parts = file.replaceAll("\\", "/").split("/");
  if (parts[0] === "app") return parts[1]?.replaceAll(/[\[\]]/g, "") || "common";
  const name = parts.at(-1)?.toLowerCase() || "";
  if (parts[1] === "match-result" || name.includes("match")) return "matches";
  if (name.includes("player") || name.includes("lobby") || name.includes("community-vote")) return "players";
  if (name.includes("champion") || name.includes("talent")) return "champions";
  if (name.includes("search")) return "search";
  if (name.includes("footer") || name.includes("nav") || name.includes("async")) return "common";
  return "components";
}

function camelSlug(value) {
  const words = value
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 10);
  if (words.length === 0) return "text";
  const [first, ...rest] = words;
  const slug = first.toLowerCase() + rest.map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase()).join("");
  return /^\d/.test(slug) ? `text${slug}` : slug;
}

function keyFor(domain, text) {
  const identity = `${domain}\u0000${text}`;
  const cached = textKeys.get(identity);
  if (cached) return cached;

  const base = `generated.${domain}.${camelSlug(text)}`;
  let key = base;
  if (keyOwners.has(key) && keyOwners.get(key) !== text) {
    key = `${base}.${crypto.createHash("sha1").update(text).digest("hex").slice(0, 7)}`;
  }
  keyOwners.set(key, text);
  generated[key] = text;
  textKeys.set(identity, key);
  return key;
}

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return filesIn(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

function componentBody(node) {
  let current = node.parent;
  while (current) {
    if (ts.isFunctionDeclaration(current) && current.body && /^[A-Z]/.test(current.name?.text || "")) {
      return current.body;
    }
    if ((ts.isFunctionExpression(current) || ts.isArrowFunction(current)) && ts.isBlock(current.body)) {
      let name = current.name?.text || "";
      if (!name && ts.isVariableDeclaration(current.parent) && ts.isIdentifier(current.parent.name)) name = current.parent.name.text;
      if (!name && ts.isCallExpression(current.parent) && ts.isVariableDeclaration(current.parent.parent) && ts.isIdentifier(current.parent.parent.name)) {
        name = current.parent.parent.name.text;
      }
      if (/^[A-Z]/.test(name)) return current.body;
    }
    current = current.parent;
  }
  return null;
}

function importInsertion(source) {
  const imports = source.statements.filter(ts.isImportDeclaration);
  if (imports.length > 0) return imports.at(-1).getEnd();
  const directive = source.statements.find((statement) => ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression));
  return directive?.getEnd() || 0;
}

function semanticSpaces(raw) {
  return {
    leading: /^[ \t]+\S/.test(raw),
    trailing: /\S[ \t]+$/.test(raw),
  };
}

function componentNameForAttribute(node) {
  const owner = node.parent?.parent;
  if (!owner || (!ts.isJsxOpeningElement(owner) && !ts.isJsxSelfClosingElement(owner))) return "";
  return owner.tagName.getText();
}

function isInternalControlAttribute(node) {
  return node.name.text === "label" && componentNameForAttribute(node) === "DimensionBars";
}

function isUiMessageCall(node) {
  if (!ts.isCallExpression(node)) return false;
  if (ts.isIdentifier(node.expression)) {
    return ["alert", "confirm", "setError", "setMessage", "setNotice", "setSuccess"].includes(node.expression.text);
  }
  return ts.isPropertyAccessExpression(node.expression)
    && ts.isIdentifier(node.expression.expression)
    && node.expression.expression.text === "window"
    && ["alert", "confirm"].includes(node.expression.name.text);
}

function uiMessageArgument(node) {
  if (isUiMessageCall(node)) return node.arguments[0];
  if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Error") {
    return node.arguments?.[0];
  }
  return null;
}

function isTranslationKeyArgument(node) {
  let current = node;
  while (current?.parent && !ts.isJsxExpression(current.parent) && !ts.isPropertyAssignment(current.parent)) {
    if (ts.isCallExpression(current.parent)
      && ts.isIdentifier(current.parent.expression)
      && ["t", "translate"].includes(current.parent.expression.text)
      && current.parent.arguments[0] === current) return true;
    current = current.parent;
  }
  return false;
}

function containingJsxExpression(node) {
  let current = node.parent;
  while (current) {
    if (ts.isJsxExpression(current)) return current;
    if (ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current) || ts.isSourceFile(current)) return null;
    current = current.parent;
  }
  return null;
}

function ancestorBefore(node, stop, predicate) {
  let current = node.parent;
  while (current && current !== stop) {
    if (predicate(current)) return current;
    current = current.parent;
  }
  return null;
}

function literalDescriptor(node, source) {
  if (ts.isStringLiteralLike(node)) return { text: normalizedText(node.text), values: [] };
  if (!ts.isTemplateExpression(node)) return null;
  let text = node.head.text;
  const values = [];
  node.templateSpans.forEach((span, index) => {
    const name = `value${index + 1}`;
    text += `{${name}}${span.literal.text}`;
    values.push({ name, expression: span.expression.getText(source) });
  });
  return { text: normalizedText(text), values };
}

const allFiles = (await Promise.all(sourceDirectories.map((directory) => filesIn(resolve(root, directory))))).flat();
let changedFiles = 0;
let migratedText = 0;
let migratedAttributes = 0;
const skippedAttributes = [];
const skippedExpressions = [];

for (const file of allFiles) {
  const input = await readFile(file, "utf8");
  const source = ts.createSourceFile(file, input, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const fileName = relative(root, file).replaceAll("\\", "/");
  const domain = domainFor(fileName);
  const isClient = /^\s*["']use client["'];/.test(input);
  const replacements = [];
  const hookBodies = new Map();
  let needsLocalizedText = false;
  let needsUseLocalization = false;

  const useComponentTranslation = (node) => {
    if (!isClient) return null;
    const body = componentBody(node);
    if (!body) return null;
    hookBodies.set(body.getStart(source), body);
    needsUseLocalization = true;
    return body;
  };

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const raw = node.getText(source);
      const text = normalizedText(raw);
      if (isUiText(text)) {
        const key = keyFor(domain, text);
        const spaces = semanticSpaces(raw);
        const translatedInComponent = useComponentTranslation(node);
        const translated = translatedInComponent
          ? `{t("${key}")}`
          : `<LocalizedText id="${key}" />`;
        if (!translatedInComponent) needsLocalizedText = true;
        replacements.push({
          start: node.getStart(source),
          end: node.getEnd(),
          text: `${spaces.leading ? '{" "}' : ""}${translated}${spaces.trailing ? '{" "}' : ""}`,
        });
        migratedText += 1;
      }
    }

    if (ts.isJsxAttribute(node) && translatableAttributes.has(node.name.text) && !isInternalControlAttribute(node)) {
      const initializer = node.initializer;
      if (initializer && ts.isStringLiteral(initializer)) {
        const text = normalizedText(initializer.text);
        if (isUiText(text)) {
          const key = keyFor(domain, text);
          if (useComponentTranslation(node)) {
            replacements.push({ start: initializer.getStart(source), end: initializer.getEnd(), text: `{t("${key}")}` });
            migratedAttributes += 1;
          } else {
            skippedAttributes.push(`${fileName}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1} ${node.name.text}=${JSON.stringify(text)}`);
          }
        }
      }
    }

    if (isUiMessageCall(node) || (isClient && ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Error")) {
      const argument = uiMessageArgument(node);
      const descriptor = argument ? literalDescriptor(argument, source) : null;
      if (argument && descriptor && isUiText(descriptor.text)) {
        if (useComponentTranslation(node)) {
          const key = keyFor(domain, descriptor.text);
          const values = descriptor.values.length > 0
            ? `, { ${descriptor.values.map(({ name, expression: value }) => `${name}: ${value}`).join(", ")} }`
            : "";
          replacements.push({ start: argument.getStart(source), end: argument.getEnd(), text: `t("${key}"${values})` });
          migratedText += 1;
        } else {
          skippedExpressions.push(`${fileName}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1} message=${JSON.stringify(descriptor.text)}`);
        }
      }
    }

    ts.forEachChild(node, visit);
  };
  visit(source);

  for (const body of hookBodies.values()) {
    const bodyText = input.slice(body.getStart(source), body.getEnd());
    if (/\{[^}]*\bt\b[^}]*\}\s*=\s*useLocalization\(\)/s.test(bodyText)) continue;
    const line = source.getLineAndCharacterOfPosition(body.getStart(source)).line;
    const lineStart = source.getPositionOfLineAndCharacter(line, 0);
    const indentation = input.slice(lineStart, body.getStart(source)).match(/^\s*/)?.[0] || "";
    replacements.push({ start: body.getStart(source) + 1, end: body.getStart(source) + 1, text: `\n${indentation}  const { t } = useLocalization();` });
  }

  const missingImports = [];
  if (needsLocalizedText && !/\bLocalizedText\b/.test(input)) missingImports.push("LocalizedText");
  if (needsUseLocalization && !/import\s*\{[^}]*\buseLocalization\b[^}]*\}\s*from\s*["']@\/lib\/localization-context["']/.test(input)) {
    missingImports.push("useLocalization");
  }
  if (missingImports.length > 0) {
    const position = importInsertion(source);
    replacements.push({
      start: position,
      end: position,
      text: `\nimport { ${missingImports.join(", ")} } from "@/lib/localization-context";`,
    });
  }

  if (replacements.length > 0) {
    replacements.sort((left, right) => right.start - left.start || right.end - left.end);
    let output = input;
    for (const replacement of replacements) {
      output = output.slice(0, replacement.start) + replacement.text + output.slice(replacement.end);
    }
    if (output !== input) {
      await writeFile(file, output, "utf8");
      changedFiles += 1;
    }
  }
}

const sortedCatalog = Object.fromEntries(Object.entries(generated).sort(([left], [right]) => left.localeCompare(right)));
await mkdir(dirname(catalogFile), { recursive: true });
await writeFile(catalogFile, `${JSON.stringify(sortedCatalog, null, 2)}\n`, "utf8");

console.log(`Migrated ${migratedText} text nodes and ${migratedAttributes} attributes in ${changedFiles} files.`);
console.log(`Generated catalog now contains ${Object.keys(sortedCatalog).length} keys.`);
if (skippedAttributes.length > 0) {
  console.log(`Skipped ${skippedAttributes.length} attributes without a client component hook scope:`);
  for (const item of skippedAttributes) console.log(`  ${item}`);
}
if (skippedExpressions.length > 0) {
  console.log(`Skipped ${skippedExpressions.length} expression/property strings without a client component hook scope:`);
  for (const item of skippedExpressions) console.log(`  ${item}`);
}
if (skippedAttributes.length > 0 || skippedExpressions.length > 0) process.exitCode = 1;
