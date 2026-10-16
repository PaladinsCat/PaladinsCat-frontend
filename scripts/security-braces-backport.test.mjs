import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifyBackport, fixedVex, reviewReports, readBoundedFile } from "./security-braces-backport.mjs";

const purl = "pkg:npm/braces@3.0.3";
const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url));
const vulnerability = (id = "CVE-2026-93687", name = "braces", version = "3.0.3") => ({
  VulnerabilityID: id, PkgName: name, InstalledVersion: version,
  PkgIdentifier: { PURL: `pkg:npm/${name}@${version}` }, Severity: "HIGH",
});
const report = (vulns = []) => ({ Results: [{ Target: "package-lock.json", Type: "npm",
  Packages: [{ Name: "braces", Version: "3.0.3", Identifier: { PURL: purl } }], Vulnerabilities: vulns }] });

test("descriptor reads admit exact size and reject oversize, directories and symlink inputs", () => {
  const directory = mkdtempSync(join(tmpdir(), "pc-backport-read-"));
  try {
    const filename = join(directory, "report");
    writeFileSync(filename, "1234");
    assert.equal(readBoundedFile(filename, 4).toString(), "1234");
    assert.throws(() => readBoundedFile(filename, 3));
    assert.throws(() => readBoundedFile(directory, 4));
    const link = join(directory, "link");
    symlinkSync(filename, link);
    assert.throws(() => readBoundedFile(link, 4));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("backport source, archive and complete locked identity match reviewed hashes", () => {
  const manifest = verifyBackport();
  const vex = fixedVex(manifest);
  assert.equal(vex.statements.length, 1);
  assert.deepEqual(vex.statements[0].products, [{ "@id": purl }]);
  assert.equal(vex.statements[0].vulnerability.name, "CVE-2026-93687");
  assert.equal(vex.statements[0].status, "fixed");
});

test("altered source, archive, manifest or lock fails before VEX admission", () => {
  for (const changed of ["vendor/braces/lib/parse.js", "vendor/braces-3.0.3.tgz", "vendor/braces-backport.json"]) {
    assert.throws(() => verifyBackport((name) => name === changed ? Buffer.concat([read(name), Buffer.from("x")]) : read(name)));
  }
  for (const mutate of [
    (lock) => { lock.packages["node_modules/braces"].resolved = "https://registry.npmjs.org/braces/-/braces-3.0.3.tgz"; },
    (lock) => { lock.packages["node_modules/braces"].version = "3.0.4"; },
    (lock) => { lock.packages["node_modules/other/node_modules/braces"] = lock.packages["node_modules/braces"]; },
  ]) {
    assert.throws(() => verifyBackport((name) => {
      if (name !== "package-lock.json") return read(name);
      const lock = JSON.parse(read(name)); mutate(lock); return Buffer.from(JSON.stringify(lock));
    }));
  }
});

test("report guard admits only the exact single advisory and retains all other findings", () => {
  assert.equal(reviewReports(report([vulnerability()]), report()).fixedByBackport, 1);
  const low = { ...vulnerability("CVE-OTHER", "other", "1.0.0"), Severity: "LOW" };
  assert.equal(reviewReports(report([vulnerability(), low]), report([low])).remainingFindings, 1);
  assert.throws(() => reviewReports(report([vulnerability(), low]), report()));
  const high = vulnerability("CVE-OTHER", "braces", "3.0.3");
  assert.throws(() => reviewReports(report([vulnerability(), high]), report([high])));
  assert.throws(() => reviewReports(report([vulnerability("CVE-2026-93687", "braces", "3.0.2")]), report()));
  assert.throws(() => reviewReports(report([vulnerability()]), { Results: [] }));
  const noBraces = report(); noBraces.Results[0].Packages[0].Name = "other";
  assert.throws(() => reviewReports(noBraces, noBraces));
  assert.throws(() => reviewReports(report([vulnerability()]), report([vulnerability()])));
});
