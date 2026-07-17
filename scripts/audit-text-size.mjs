import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const root = resolve(process.cwd());
const sourceDirectories = ["app", "components", "lib"];
const sourceExtensions = /\.(?:css|ts|tsx)$/;
const minimumPixels = 12;
const findings = [];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return filesIn(path);
    return sourceExtensions.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

function lineAt(input, offset) {
  return input.slice(0, offset).split("\n").length;
}

function pixels(value, unit) {
  if (unit === "px") return value;
  if (unit === "rem") return value * 16;
  return null;
}

function addFinding(file, input, match, renderedPixels, kind) {
  findings.push({
    file: relative(root, file).replaceAll("\\", "/"),
    line: lineAt(input, match.index),
    kind,
    value: match[0],
    renderedPixels,
  });
}

function auditFile(file, input) {
  const arbitraryTextSize = /text-\[(?<value>[0-9]*\.?[0-9]+)(?<unit>px|rem|em)\]/g;
  for (const match of input.matchAll(arbitraryTextSize)) {
    const value = Number(match.groups.value);
    const unit = match.groups.unit;
    const renderedPixels = pixels(value, unit);
    const unsafeRelativeSize = unit === "em" && value < 0.75;
    if ((renderedPixels != null && renderedPixels > 0 && renderedPixels < minimumPixels) || unsafeRelativeSize) {
      addFinding(file, input, match, renderedPixels, "tailwind");
    }
  }

  const cssFontSize = /font-size:\s*(?<value>[0-9]*\.?[0-9]+)(?<unit>px|rem)/g;
  for (const match of input.matchAll(cssFontSize)) {
    const renderedPixels = pixels(Number(match.groups.value), match.groups.unit);
    if (renderedPixels > 0 && renderedPixels < minimumPixels) {
      addFinding(file, input, match, renderedPixels, "css");
    }
  }

  const inlineFontSize = /fontSize\s*(?:=\{?|:)\s*(?<value>[0-9]*\.?[0-9]+)/g;
  for (const match of input.matchAll(inlineFontSize)) {
    const renderedPixels = Number(match.groups.value);
    if (renderedPixels > 0 && renderedPixels < minimumPixels) {
      addFinding(file, input, match, renderedPixels, "inline");
    }
  }
}

for (const directory of sourceDirectories) {
  for (const file of await filesIn(resolve(root, directory))) {
    auditFile(file, await readFile(file, "utf8"));
  }
}

if (findings.length === 0) {
  console.log(`Minimum text-size audit passed (${minimumPixels}px floor).`);
} else {
  console.error(`${findings.length} text-size violation(s) below ${minimumPixels}px:`);
  for (const finding of findings) {
    const size = finding.renderedPixels == null ? "relative" : `${finding.renderedPixels}px`;
    console.error(`${finding.file}:${finding.line} [${finding.kind}, ${size}] ${finding.value}`);
  }
  process.exitCode = 1;
}
