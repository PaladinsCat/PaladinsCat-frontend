/** Render the real profile component against its normal API contract.
 * Run from the canonical frontend with PLAYER_PROFILE_SOURCE_ROOT pointing at
 * an immutable source export. PLAYER_PROFILE_RESPONSE_FILE optionally supplies
 * a credential-free live profile response from the external runtime boundary.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.resolve(process.env.PLAYER_PROFILE_SOURCE_ROOT || scriptRoot);
const dependencyRoot = path.resolve(process.env.PLAYER_PROFILE_DEPENDENCY_ROOT || process.cwd());
const installed = createRequire(path.join(dependencyRoot, "package.json"));
const React = installed("react");
const { renderToString, renderToStaticMarkup } = installed("react-dom/server");
const ts = installed("typescript");
const revision = process.env.PLAYER_PROFILE_SOURCE_REVISION;
const readSource = relative => revision
  ? execFileSync("git", ["-C", sourceRoot, "show", `${revision}:${relative}`], { encoding: "utf8", timeout: 10_000 })
  : readFileSync(path.join(sourceRoot, relative), "utf8");

function childrenOnly({ children }) { return React.createElement(React.Fragment, null, children); }
function Link({ href, children, className }) { return React.createElement("a", { href, className }, children); }
const childModule = new Proxy({ __esModule: true, default: childrenOnly }, {
  get: (target, name) => name in target ? target[name] : childrenOnly,
});
const localization = {
  t: key => key,
  formatNumber: value => value == null ? "—" : String(Number(value)),
  formatPercent: value => value == null ? "—" : String(Number(value)),
  formatDuration: value => String(value),
  formatDate: value => value == null ? "—" : String(value),
  formatDateTime: value => value == null ? "—" : String(value),
};
const auth = { user: { id: 42, linkedPlayerId: 16706730, invitationActive: false, invitationRequired: false },
  isLoading: false, isLoggedIn: true, isAdmin: false, isApproved: false };
const stubs = {
  react: React,
  "react/jsx-runtime": installed("react/jsx-runtime"),
  "next/link": { __esModule: true, default: Link },
  "next/navigation": { useRouter: () => ({ push() {}, replace() {} }) },
  "lucide-react": childModule,
  "@/lib/auth-context": { useAuth: () => auth },
  "@/lib/localization-context": { useLocalization: () => localization },
  "@/lib/route-transition-context": { useRouteSettledLoading: value => value },
  "@/lib/use-local-preview-access": { useLocalPreviewAccess: () => false, localPreviewAccessEnabled: () => false },
  "@/lib/api-client": { clearPlayerTag: async () => {}, fetchPlayerMatches: async () => [] },
  "@/lib/player-moderation": { fetchPlayerModeration: async () => ({ verified: false }) },
};
const modules = new Map();
function load(relative) {
  if (modules.has(relative)) return modules.get(relative).exports;
  const module = { exports: {} };
  modules.set(relative, module);
  if (relative.endsWith(".json")) { module.exports = JSON.parse(readSource(relative)); return module.exports; }
  const code = ts.transpileModule(readSource(relative), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const requireSource = name => {
    if (name in stubs) return stubs[name];
    if (name.startsWith("@/components/")) return childModule;
    const resolved = name.startsWith("@/") ? name.slice(2)
      : name.startsWith(".") ? path.posix.normalize(path.posix.join(path.posix.dirname(relative), name)) : null;
    if (resolved) return load(/\.(?:json|tsx?|mjs|js)$/.test(resolved) ? resolved : `${resolved}.ts`);
    throw new Error(`Unexpected profile dependency: ${name}`);
  };
  new Function("require", "module", "exports", code)(requireSource, module, module.exports);
  return module.exports;
}
const PlayerProfileClient = load("app/players/[id]/player-profile-client.tsx").default;

function normalProfile() {
  // The normal backend selects p.* and omits optional Pro ratings, derived
  // averages, presence and champion refresh data; these are not empty arrays.
  return {
    player: { id: "16706730", name: "Normal contract player", level: 17,
      wins: 123, losses: 45, leaves: 0, hours_played: 100, minutes_played: 6000,
      mastery_level: 12, region: "Europe", platform: "PC", platform_name: "PC",
      total_xp: "1000", total_worshippers: "2000", total_achievements: 3,
      avatar_id: 0, avatar_url: null, title: "", loading_frame: "",
      created_datetime: "2020-01-01T00:00:00Z", last_login_datetime: "2026-10-13T00:00:00Z",
      personal_status_message: "", privacy_flag: "n", kbm_points: 10, kbm_tier: 1,
      kbm_season: 8, kbm_wins: 7, kbm_losses: 3, kbm_rank: 100, kbm_name: "Bronze",
      kbm_leaves: 0, kbm_trend: 0, kbm_prev_rank: 100, verified: true,
      cheater: false, exploiter: false, dropper: false, afk_wintrade: false,
      alt_account: false, boosted: false, sus_count: 0, weirdo_count: 0, hall_of_fame_count: 0 },
    globalStats: null,
    access: { fullAccess: true, limit: null, remaining: null, resetAtMs: null },
    profileRefresh: { ttl_seconds: 1800, refreshed_at: "2026-10-13T00:00:00Z",
      expires_at: "2026-10-13T00:30:00Z", remaining_seconds: 1200, expired: false,
      attempted: false, refreshed: false, source: "database" },
  };
}
function render(response) {
  return renderToString(React.createElement(PlayerProfileClient, { id: String(response.player.id), initialResponse: response }));
}
function assertPopulated(html, response) {
  const escapedName = renderToStaticMarkup(React.createElement(React.Fragment, null, response.player.name));
  assert.ok(html.includes(escapedName), "the full profile renders its actual player name");
  assert.ok(html.includes("generated.players.overall"), "the confirmed non-Pro viewer receives the profile overview");
  assert.ok(!html.includes("generated.players.playerProfileUnavailable"));
  assert.ok(!html.includes("generated.players.failedToLoadProfile"));
}

test("a full normal profile renders with omitted Pro arrays and objects", () => {
  const response = normalProfile();
  assert.equal("queueRatings" in response, false);
  assert.equal("championRatings" in response, false);
  const html = render(response);
  assertPopulated(html, response);
  assert.ok(html.includes("123"), "ordinary account-wide wins survive");
  assert.ok(html.includes("generated.players.noRankedRatingYet"), "absent optional rating renders its fallback");
});

test("empty rating arrays retain the populated profile", () => {
  const response = { ...normalProfile(), queueRatings: [], championRatings: [] };
  assertPopulated(render(response), response);
});

test("present queue ratings retain their main and additional rating content", () => {
  const response = { ...normalProfile(), queueRatings: [
    { queue_id: 486, mu: 1234, phi: 50, volatility: 0.06, matches_played: 10, wins: 7, losses: 3 },
    { queue_id: 424, mu: 2345, phi: 60, volatility: 0.06, matches_played: 20, wins: 12, losses: 8 },
  ], championRatings: [] };
  const html = render(response);
  assertPopulated(html, response);
  assert.ok(html.includes("1234"), "the ranked rating survives");
  assert.ok(html.includes("2345"), "additional queue ratings survive");
});

test("the captured public API response renders for a linked non-Pro viewer", {
  skip: !process.env.PLAYER_PROFILE_RESPONSE_FILE,
}, () => {
  const response = JSON.parse(readFileSync(process.env.PLAYER_PROFILE_RESPONSE_FILE, "utf8"));
  assert.equal("queueRatings" in response, false, "live public response preserves the triggering omission");
  assert.equal("championRatings" in response, false);
  assertPopulated(render(response), response);
});
