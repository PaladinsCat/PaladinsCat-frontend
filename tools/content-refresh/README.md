# Maintainer content-refresh tools

These tools are manual, review-required content maintenance utilities. They are
not production build, test, or deployment scripts and are intentionally absent
from `package.json`.

- `sync-loading-frames.mjs` refreshes loading-frame content.
- `sync-champion-talent-ids.js` refreshes champion talent identifiers.

Run only for the named data-refresh task, review the complete diff, and pass the
normal frontend build gates before committing.
