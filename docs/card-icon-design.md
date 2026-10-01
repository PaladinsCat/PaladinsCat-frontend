# PaladinsCat card icons

Interface and topic icons use the installed `lucide-react` library. The homepage,
Players directory, and player sidebar share the stable topic mapping in
`components/card-icon.tsx`. Import individual Lucide components for controls;
do not duplicate their SVG paths or use emoji as interface icons.

## Visual language

Follow Lucide's simple outline language: balanced silhouettes, low detail density,
clear spacing, rounded corners, and consistent visual weight. The library owns
the geometry; `app/globals.css` owns the shared `--pc-icon-stroke` token and
`.lucide` stroke/cap/join rules. Component size and topic accent remain contextual.

References: [Lucide design principles](https://lucide.dev/contribute/icons/design-principles),
[React usage](https://lucide.dev/guide/react), [ISC license](https://lucide.dev/license).

- Canvas: 24 by 24; regular 2-unit stroke with round caps and joins.
- Topic icons display at 32px; navigation arrows at 16px.
- Inherit `currentColor`; no icon backgrounds, frames, embedded fonts, or fills.
- Keep silhouettes distinct across different destinations. The same destination
  can keep its icon across pages (for example, Ranked Leaderboard).
- Champions uses `Swords` across cards and mobile navigation; Flank Diff uses
  `Sword`, Tank Diff `Shield`, and Support Diff `Cross`. Account and champion
  leaderboards keep distinct rating, performance, and progression symbols.
- Search uses `Search`, close/clear `X`, export `Download`, and verification
  `BadgeCheck` everywhere. Active state changes color/background, not stroke weight.
- Existing icon keys are stable component identifiers, not third-party glyph IDs.
- Keep decorative SVGs hidden from assistive technology; card text names the link.

Preserve champion, item, class, and game-rank artwork, official brand/platform
logos, and chart geometry. These communicate domain data rather than interface
actions. Flaticon/UIcons remain banned; do not add fonts, assets, packages, CDN
links, or icon classes from that family.
