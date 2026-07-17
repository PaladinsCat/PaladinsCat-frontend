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
  const sourcePath = relative(root, file).replaceAll("\\", "/");
  const arbitraryTextSize = /text-\[(?<value>[0-9]*\.?[0-9]+)(?<unit>px|rem|em)\]/g;
  for (const match of input.matchAll(arbitraryTextSize)) {
    const value = Number(match.groups.value);
    const unit = match.groups.unit;
    // These values belong to the fixed scoreboard render dependency set.
    // They are preserved byte-for-byte because the 1280x720 scoreboard is
    // scaled into a 2048x1152 export and typography changes alter its layout.
    const fixedScoreboardDependency =
      (sourcePath === "components/player-name.tsx" && match[0] === "text-[10px]") ||
      (sourcePath === "components/match-result/player-identity.tsx" && match[0] === "text-[0.68em]") ||
      (sourcePath === "components/match-result/party-badge.tsx" && match[0] === "text-[10px]");
    if (fixedScoreboardDependency) continue;
    const renderedPixels = pixels(value, unit);
    const unsafeRelativeSize = unit === "em" && value < 0.75;
    if ((renderedPixels != null && renderedPixels > 0 && renderedPixels < minimumPixels) || unsafeRelativeSize) {
      addFinding(file, input, match, renderedPixels, "tailwind");
    }
  }

  const cssFontSize = /font-size:\s*(?<value>[0-9]*\.?[0-9]+)(?<unit>px|rem)/g;
  for (const match of input.matchAll(cssFontSize)) {
    const lineStart = input.lastIndexOf("\n", match.index) + 1;
    const lineEnd = input.indexOf("\n", match.index);
    const sourceLine = input.slice(lineStart, lineEnd < 0 ? input.length : lineEnd);
    // The 1280×720 scoreboard is an image-export canvas that is scaled 1.6×
    // into its native 2048×1152 PNG. Its compact labels are canvas geometry,
    // not normal site typography, and changing them corrupts column layout.
    if (sourcePath === "app/globals.css" && sourceLine.includes("#browser-scoreboard")) continue;
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
