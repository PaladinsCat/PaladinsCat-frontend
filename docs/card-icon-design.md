# PaladinsCat card icons

The homepage, Players directory, and player sidebar use original inline SVG
artwork owned by `components/card-icon.tsx`. No icon font, external stylesheet,
third-party vector paths, or attribution text is required by this implementation.

## Visual language

The Paladins Wiki's champion classes and the game's existing class/rank artwork
informed the subject vocabulary: defensive shields, healing crosses, blades,
pointed heraldic crests, and faceted crystals. These are newly drawn geometric
paths, not traced game emblems or converted Flaticon glyphs.

Reference: https://paladins.fandom.com/wiki/Paladins_Wiki

- Canvas: 32 by 32; regular 1.65-unit stroke with round caps and joins.
- Topic icons display at 32px; navigation arrows at 16px.
- Inherit `currentColor`; no icon backgrounds, frames, embedded fonts, or fills.
- Keep silhouettes distinct across different destinations. The same destination
  can keep its icon across pages (for example, Ranked Leaderboard).
- Champions uses a helmet; Flank Diff a dagger; Tank Diff a reinforced shield;
  Support Diff a healing cross. Account and champion leaderboards have distinct
  rating, performance, and progression symbols.
- Existing icon keys are stable component identifiers, not third-party glyph IDs.
- Keep decorative SVGs hidden from assistive technology; card text names the link.

The change replaces all Flaticon usages, including profile loadouts, champion
statistics, friends, and relationship summaries. Discord invitation artwork and
other existing UI icon systems are outside this replacement.
