/** Tests champion icon lookup and fallback behavior.
 * The module preserves canonical data, asset, or metadata behavior used by existing callers.
 * refs: none
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { getChampionIconSafe } from "./champion-icons.ts";
import { STATIC_CHAMPIONS } from "./static-champions.ts";

const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));

test("every champion resolves to tracked AVIF and PNG artwork", () => {
  assert.equal(STATIC_CHAMPIONS.length, 59);

  for (const champion of STATIC_CHAMPIONS) {
    const avifPath = getChampionIconSafe(champion.name);
    const pngPath = avifPath.replace(/\.avif$/i, ".png");

    assert.ok(existsSync(`${publicRoot}${avifPath.slice(1)}`), `${champion.name}: missing ${avifPath}`);
    assert.ok(existsSync(`${publicRoot}${pngPath.slice(1)}`), `${champion.name}: missing ${pngPath}`);
  }
});

test("API spelling variants resolve to canonical filenames", () => {
  assert.equal(getChampionIconSafe("Betty la Bomba"), "/images/champions/Champion BettyLaBomba Icon.avif");
  assert.equal(getChampionIconSafe("Bomb King"), "/images/champions/Champion BombKing Icon.avif");
  assert.equal(getChampionIconSafe("Mal Damba"), "/images/champions/Champion Mal'Damba Icon.avif");
  assert.equal(getChampionIconSafe("Sha Lin"), "/images/champions/Champion ShaLin Icon.avif");
  assert.equal(getChampionIconSafe("Vii"), "/images/champions/Champion VII Icon.avif");
});
