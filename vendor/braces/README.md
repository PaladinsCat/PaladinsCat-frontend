# braces 3.0.3 security backport

This is the MIT-licensed `braces` package, with the nesting/AST-depth guards
backported from [upstream PR 72](https://github.com/micromatch/braces/pull/72),
tree `28d440b5dd449dbf1fe6f3506cf94ecca4d02660`. The upstream PR is closed and
this is a locally maintained backport, not an upstream fixed release.

The original name and version are retained. The selected change sets a hard
maximum nesting depth of 100 for braces and parentheses, allows a lower
`maxDepth`, checks external AST depth in compile/expand/stringify, and rejects
cycles in expansion's parent-chain traversal. The unrelated quote parsing and
`block.invalid` changes in that tree are deliberately excluded, preserving
3.0.3 behavior. `index.js`, `utils.js`, and the MIT license are unchanged.

The package is used only by development tools through micromatch. The application
lockfile includes it in security scans. CVE-2026-93687 is addressed by this
backport; no version is invented and no advisory is globally ignored.

`../braces-backport.json` records source and archive hashes. The dependency tests
verify those bytes and installation. `scripts/security-braces-backport.mjs`
admits the single fixed OpenVEX statement only for that exact source/archive and
the exact locked package identity. Any other advisory remains actionable.

To rebuild the archive with npm 11: `npm pack ./vendor/braces --ignore-scripts
--pack-destination ./vendor`. A source change requires review, regenerated
hashes/archive, regression tests, and an updated evidence-bound VEX decision.
Prefer an upstream fixed release once one exists, after its own review/tests.
