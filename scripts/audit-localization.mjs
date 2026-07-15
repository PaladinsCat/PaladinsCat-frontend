import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(process.cwd());
const sourceDirectories = ["app", "components"];
const translatableAttributes = new Set(["alt", "aria-label", "description", "label", "message", "placeholder", "text", "title"]);
const translatableProperties = /^(?:ariaLabel|caption|description|empty(?:Label|Message|Text)?|heading|label|message|placeholder|subtitle|title|tooltip)$/i;
const findings = [];
const findingPositions = new Set();

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return filesIn(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

function addFinding(source, node, text, kind) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!/[A-Za-z]/.test(normalized) || normalized.length < 2) return;
  const identity = `${source.fileName}:${node.getStart(source)}:${kind}`;
  if (findingPositions.has(identity)) return;
  findingPositions.add(identity);
  const position = source.getLineAndCharacterOfPosition(node.getStart(source));
  findings.push({
    file: source.fileName.replace(`${root}\\`, "").replaceAll("\\", "/"),
    line: position.line + 1,
    kind,
    text: normalized,
  });
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

function componentNameForAttribute(node) {
  const owner = node.parent?.parent;
  if (!owner || (!ts.isJsxOpeningElement(owner) && !ts.isJsxSelfClosingElement(owner))) return "";
  return owner.tagName.getText();
}

function isInternalControlAttribute(node) {
  return node.name.text === "label" && componentNameForAttribute(node) === "DimensionBars";
}

function isProgramControlLiteral(node, expression) {
  return Boolean(ancestorBefore(node, expression, (ancestor) => (
    ts.isBinaryExpression(ancestor)
    || ts.isCaseClause(ancestor)
  )));
}

function uiMessageArgument(node, isClient) {
  if (ts.isCallExpression(node)) {
    if (ts.isIdentifier(node.expression)
      && ["alert", "confirm", "setError", "setMessage", "setNotice", "setSuccess"].includes(node.expression.text)) {
      return node.arguments[0];
    }
    if (ts.isPropertyAccessExpression(node.expression)
      && ts.isIdentifier(node.expression.expression)
      && node.expression.expression.text === "window"
      && ["alert", "confirm"].includes(node.expression.name.text)) {
      return node.arguments[0];
    }
  }
  if (isClient && ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Error") {
    return node.arguments?.[0];
  }
  return null;
}

function literalText(node, source) {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isTemplateExpression(node)) return node.getText(source).slice(1, -1).replace(/\$\{[^}]+\}/g, "{value}");
  return null;
}

for (const directory of sourceDirectories) {
  for (const file of await filesIn(resolve(root, directory))) {
    const input = await readFile(file, "utf8");
    const source = ts.createSourceFile(file, input, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const isClient = /^\s*["']use client["'];/.test(input);
    const visit = (node) => {
      if (ts.isJsxText(node)) addFinding(source, node, node.getText(source), "text");

      if (ts.isJsxAttribute(node) && translatableAttributes.has(node.name.text) && !isInternalControlAttribute(node)) {
        const value = node.initializer;
        if (value && ts.isStringLiteral(value)) addFinding(source, value, value.text, `attribute:${node.name.text}`);
      }

      const messageArgument = uiMessageArgument(node, isClient);
      if (messageArgument && (ts.isStringLiteralLike(messageArgument) || ts.isTemplateExpression(messageArgument))) {
        const text = literalText(messageArgument, source);
        if (text) addFinding(source, messageArgument, text, "message");
      }

      if ((ts.isStringLiteralLike(node) || ts.isTemplateExpression(node)) && !isTranslationKeyArgument(node)) {
        const text = literalText(node, source);
        const expression = containingJsxExpression(node);
        if (expression && isProgramControlLiteral(node, expression)) {
          ts.forEachChild(node, visit);
          return;
        }
        const property = expression ? ancestorBefore(node, expression, ts.isPropertyAssignment) : null;
        const call = expression ? ancestorBefore(node, expression, ts.isCallExpression) : null;
        if (text && property) {
          const propertyName = property.name;
          const name = ts.isIdentifier(propertyName) || ts.isStringLiteralLike(propertyName) ? propertyName.text : "";
          if (translatableProperties.test(name)) addFinding(source, node, text, `property:${name}`);
        } else if (text && expression && !call) {
          const attribute = ts.isJsxAttribute(expression.parent) ? expression.parent : null;
          if (!attribute || translatableAttributes.has(attribute.name.text)) {
            addFinding(source, node, text, attribute ? `attribute:${attribute.name.text}` : "expression");
          }
        } else if (text && ts.isPropertyAssignment(node.parent)) {
          const property = node.parent.name;
          const name = ts.isIdentifier(property) || ts.isStringLiteralLike(property) ? property.text : "";
          if (translatableProperties.test(name)) addFinding(source, node, text, `property:${name}`);
        }
      }

      ts.forEachChild(node, visit);
    };
    visit(source);
  }
}

const uniqueText = new Set(findings.map(({ text }) => text));
if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ occurrences: findings.length, uniqueStrings: uniqueText.size, findings }, null, 2));
  process.exit(0);
}

console.log(`${findings.length} hardcoded UI-text occurrences (${uniqueText.size} unique strings).`);
for (const finding of findings) {
  console.log(`${finding.file}:${finding.line}  [${finding.kind}] ${finding.text}`);
}

if (process.argv.includes("--strict") && findings.length > 0) process.exitCode = 1;
