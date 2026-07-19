export type EffectKey =
  | "movement-speed"
  | "mount-speed"
  | "damage-reduction-direct"
  | "damage-reduction-area"
  | "life-steal"
  | "healing-received"
  | "crowd-control-reduction"
  | "cooldown-reduction"
  | "reload-speed"
  | "ultimate-charge"
  | "maximum-health"
  | "maximum-ammo"
  | "shield-health"
  | "shield-effectiveness"
  | "weapon-damage";

export type EffectSourceType = "talent" | "card" | "item";

export interface DetectedEffect {
  key: EffectKey;
  value: number;
  sourceId: number;
  sourceName: string;
  sourceType: EffectSourceType;
  description: string;
}

export interface DiminishedValue {
  additive: number;
  final: number;
  lost: number;
  capped: boolean;
}

const NUMBER = "(-?(?:\\d+(?:\\.\\d*)?|\\.\\d+))";

function numericMatch(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = Number(match[1]);
      if (Number.isFinite(value)) return value;
    }
  }
  return null;
}

export function resolveScaledDescription(description: string | null | undefined, level: number): string {
  if (!description) return "";
  const safeLevel = Math.max(1, Math.min(5, Math.round(level || 1)));
  return description
    .replace(/^\s*(?:\[[^\]]+\]\s*)+/, "")
    .replace(/\{\s*(?:scale\s*=\s*)?(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\|\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\}/gi, (_match, base: string, increase: string) => {
      const value = Number(base) + Number(increase) * (safeLevel - 1);
      return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
    })
    .replace(/\{\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function effect(
  key: EffectKey,
  value: number | null,
  source: Omit<DetectedEffect, "key" | "value">,
): DetectedEffect[] {
  return value == null || value === 0 ? [] : [{ ...source, key, value }];
}

/**
 * Extract only explicit, calculator-safe stat changes. The full source text is
 * retained because many Paladins bonuses are conditional and should be read as
 * a simultaneous best-case estimate, not as permanent uptime.
 */
export function detectDescriptionEffects(input: {
  id: number;
  name: string;
  type: EffectSourceType;
  description?: string | null;
  level?: number;
}): DetectedEffect[] {
  const description = resolveScaledDescription(input.description, input.level ?? 1);
  if (!description) return [];
  const source = {
    sourceId: input.id,
    sourceName: input.name,
    sourceType: input.type,
    description,
  };
  const results: DetectedEffect[] = [];

  if (/at level 3/i.test(description) && (input.level ?? 1) < 3) return [];

  const movement = numericMatch(description, [
    new RegExp(`(?:gain|increase)(?: your)?\\s+${NUMBER}%\\s+(?:bonus )?movement speed`, "i"),
    new RegExp(`(?:increase|gain)[^.]*?movement speed(?: bonus)?[^.]*?by\\s+${NUMBER}%`, "i"),
  ]);
  results.push(...effect("movement-speed", movement, source));

  const movementPenalty = numericMatch(description, [
    new RegExp(`reduce your movement speed(?: bonus)?[^.]*?by\\s+${NUMBER}%`, "i"),
  ]);
  results.push(...effect("movement-speed", movementPenalty == null ? null : -Math.abs(movementPenalty), source));

  const mountSpeed = numericMatch(description, [
    new RegExp(`increase your mount speed[^.]*?by\\s+${NUMBER}%`, "i"),
    new RegExp(`gain\\s+${NUMBER}%\\s+mount speed`, "i"),
  ]);
  results.push(...effect("mount-speed", mountSpeed, source));

  const damageReduction = numericMatch(description, [
    new RegExp(`reduce (?:the )?damage (?:you take|taken|received)[^.]*?by\\s+${NUMBER}%`, "i"),
    new RegExp(`reduce your damage taken[^.]*?by\\s+${NUMBER}%`, "i"),
    new RegExp(`gain\\s+${NUMBER}%\\s+damage reduction`, "i"),
  ]);
  if (damageReduction != null) {
    const directOnly = /direct attacks?/i.test(description);
    const areaOnly = /area of effect|area damage|blast damage/i.test(description);
    if (!areaOnly) results.push(...effect("damage-reduction-direct", damageReduction, source));
    if (!directOnly) results.push(...effect("damage-reduction-area", damageReduction, source));
  }

  const lifeSteal = numericMatch(description, [
    new RegExp(`${NUMBER}%\\s+life\\s*steal`, "i"),
    new RegExp(`life\\s*steal[^.]*?by\\s+${NUMBER}%`, "i"),
  ]);
  results.push(...effect("life-steal", lifeSteal, source));

  const healingReceived = numericMatch(description, [
    new RegExp(`receive\\s+${NUMBER}%\\s+more healing`, "i"),
    new RegExp(`increase (?:your )?(?:healing received|healing from other players)[^.]*?by\\s+${NUMBER}%`, "i"),
  ]);
  results.push(...effect("healing-received", healingReceived, source));

  const crowdControlReduction = numericMatch(description, [
    new RegExp(`reduce (?:the )?duration and effectiveness of crowd control and slows[^.]*?by\\s+${NUMBER}%`, "i"),
    new RegExp(`reduce (?:the )?duration of crowd control[^.]*?by\\s+${NUMBER}%`, "i"),
  ]);
  results.push(...effect("crowd-control-reduction", crowdControlReduction, source));

  const cooldownReduction = numericMatch(description, [
    new RegExp(`reduce (?:the )?cooldown of all (?:your )?abilities[^.]*?by\\s+${NUMBER}%`, "i"),
    new RegExp(`reduce your active cooldowns[^.]*?by\\s+${NUMBER}%`, "i"),
  ]);
  results.push(...effect("cooldown-reduction", cooldownReduction, source));

  const reloadSpeed = numericMatch(description, [
    new RegExp(`increase your reload speed[^.]*?by\\s+${NUMBER}%`, "i"),
    new RegExp(`gain\\s+${NUMBER}%\\s+reload speed`, "i"),
  ]);
  results.push(...effect("reload-speed", reloadSpeed, source));

  const ultimateCharge = numericMatch(description, [
    new RegExp(`increase your ultimate charge rate[^.]*?by\\s+${NUMBER}%`, "i"),
    new RegExp(`gain\\s+${NUMBER}%\\s+ultimate charge rate`, "i"),
  ]);
  results.push(...effect("ultimate-charge", ultimateCharge, source));

  const maximumHealth = numericMatch(description, [
    new RegExp(`increase your maximum health[^.%]*?by\\s+${NUMBER}(?![\\d.]|\\s*%)`, "i"),
    new RegExp(`gain\\s+${NUMBER}\\s+maximum health`, "i"),
  ]);
  results.push(...effect("maximum-health", maximumHealth, source));

  const maximumAmmo = numericMatch(description, [
    new RegExp(`increase your maximum ammo[^.%]*?by\\s+${NUMBER}(?![\\d.]|\\s*%)`, "i"),
  ]);
  results.push(...effect("maximum-ammo", maximumAmmo, source));

  const shieldHealth = numericMatch(description, [
    new RegExp(`gain (?:a )?${NUMBER}(?:-health)? shield`, "i"),
    new RegExp(`increase [^.]*?shield(?:'s)? maximum health[^.%]*?by\\s+${NUMBER}(?![\\d.]|\\s*%)`, "i"),
    new RegExp(`increase (?:the )?health of [^.]*?shield[^.%]*?by\\s+${NUMBER}(?![\\d.]|\\s*%)`, "i"),
  ]);
  results.push(...effect("shield-health", shieldHealth, source));

  const shieldEffectiveness = numericMatch(description, [
    new RegExp(`increase (?:the )?effectiveness of shields you create[^.]*?by\\s+${NUMBER}%`, "i"),
  ]);
  results.push(...effect("shield-effectiveness", shieldEffectiveness, source));

  const weaponDamage = numericMatch(description, [
    new RegExp(`weapon (?:shots|attacks)[^.]*?deal\\s+${NUMBER}%\\s+increased damage`, "i"),
    new RegExp(`increase (?:your )?weapon damage[^.]*?by\\s+${NUMBER}%`, "i"),
    new RegExp(`increase (?:your )?in-hand weapon damage dealt[^.]*?by\\s+${NUMBER}%`, "i"),
  ]);
  results.push(...effect("weapon-damage", weaponDamage, source));

  const levelThreeBundle = numericMatch(description, [
    new RegExp(`gain\\s+${NUMBER}%\\s+movement, mount, cooldown, and ultimate charge speed`, "i"),
  ]);
  if (levelThreeBundle != null) {
    results.push(...effect("movement-speed", levelThreeBundle, source));
    results.push(...effect("mount-speed", levelThreeBundle, source));
    results.push(...effect("cooldown-reduction", levelThreeBundle, source));
    results.push(...effect("ultimate-charge", levelThreeBundle, source));
  }

  return results;
}

function diminishOneSide(values: number[], movement: boolean): { value: number; capped: boolean } {
  const bonuses = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!bonuses.length) return { value: 0, capped: false };
  const cap = movement ? 1.5 : 0.95;
  const total = bonuses.reduce((sum, value) => sum + value, 0) / 100;
  const highest = Math.max(...bonuses) / 100;
  if (total <= 0.3 || bonuses.length === 1) {
    return { value: Math.min(total, cap) * 100, capped: total > cap };
  }
  const diminished = movement
    ? highest + (1.5 - highest) * ((total - highest) / (total + 1.06))
    : highest + (0.95 - highest) * ((total - highest) / (total + 0.5));
  return { value: Math.min(diminished, cap) * 100, capped: diminished > cap || total > cap };
}

export function calculateDiminishedValue(values: number[], options?: { movement?: boolean; reload?: boolean }): DiminishedValue {
  const additive = values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
  if (options?.reload) {
    const final = Math.max(-60, Math.min(60, additive));
    return { additive, final, lost: Math.abs(additive) - Math.abs(final), capped: Math.abs(additive) > 60 };
  }
  const positive = diminishOneSide(values.filter((value) => value > 0), Boolean(options?.movement));
  const negative = diminishOneSide(values.filter((value) => value < 0).map(Math.abs), Boolean(options?.movement));
  const final = positive.value - negative.value;
  return {
    additive,
    final,
    lost: Math.abs(additive) - Math.abs(final),
    capped: positive.capped || negative.capped,
  };
}

export function extractWeaponDamageOverride(description: string | null | undefined): number | null {
  const text = resolveScaledDescription(description, 1);
  const value = numericMatch(text, [
    new RegExp(`your weapon[^.]*?dealing\\s+${NUMBER}\\s+(?:direct )?damage`, "i"),
    new RegExp(`weapon (?:shots|attacks)[^.]*?deal\\s+${NUMBER}\\s+(?:direct )?damage`, "i"),
  ]);
  return value != null && value > 0 ? value : null;
}
