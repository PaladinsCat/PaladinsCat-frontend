# Contributing to PaladinsCat Frontend

## Development Setup
1. Node.js 20+ and npm
2. Install: `npm install`
3. Run: `npm run dev`
4. Lint: `npm run lint`
5. TypeScript: `npx tsc --noEmit`

### Local preview without OIDC

For explicit local UI testing only, run:

```powershell
./scripts/Start-PaladinsCatDevProxy.ps1 -Port 3101 -DistDir .next-loading-frames -LocalAuthBypass
```

The switch binds the development server to loopback and sets
`NEXT_PUBLIC_LOCAL_AUTH_BYPASS=1`. The shared UI gate additionally requires
`NODE_ENV=development` and an actual localhost/loopback browser hostname.
Production and non-loopback hosts cannot use it, even with the flag set.
It does not create an account, bypass backend permissions, or grant write access.
Without the switch, normal authentication is required.

`/dev/loading-frames` exercises all 82 player-frame assets using the real component.
This route requires the same local-only opt-in. Run its WebP/PNG browser checks
with `npx playwright test --config test/loading-frames.config.ts` while the local
preview is running. Set `LOADING_FRAME_PLAYER_FIXTURES` to a JSON array containing
public `{ "id": "...", "loading_frame": "..." }` records to also verify individual
live profiles. Fixture frame labels are discovery hints; checks use current API data.

## Branch Naming
- Features: `feat/description`
- Fixes: `fix/description`

## Pull Requests
- Reference an issue number in the PR title
- Ensure CI passes (lint, tsc, build)
