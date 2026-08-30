import assert from "node:assert/strict";
import test from "node:test";
import {
  parsePlayerAvatarFile,
  playerAvatarProxyPath,
  playerAvatarUpstreamUrl,
} from "./player-avatar-proxy.ts";

test("avatar proxy accepts only bounded numeric PNG paths", () => {
  assert.equal(parsePlayerAvatarFile("33653.png"), "33653");
  assert.equal(parsePlayerAvatarFile("0.png"), null);
  assert.equal(parsePlayerAvatarFile("33653.webp"), null);
  assert.equal(parsePlayerAvatarFile("../33653.png"), null);
  assert.equal(parsePlayerAvatarFile("12345678901.png"), null);
});

test("avatar proxy path requires the exact allowlisted Hi-Rez URL", () => {
  assert.equal(
    playerAvatarProxyPath(33653, "https://hirez-api.onrender.com/paladins/avatar/33653"),
    "/player-avatars/33653.png",
  );
  assert.equal(playerAvatarProxyPath(33653, "http://hirez-api.onrender.com/paladins/avatar/33653"), null);
  assert.equal(playerAvatarProxyPath(33653, "https://example.com/paladins/avatar/33653"), null);
  assert.equal(playerAvatarProxyPath(33653, "https://hirez-api.onrender.com/paladins/avatar/1"), null);
  assert.equal(playerAvatarProxyPath(33653, "https://hirez-api.onrender.com/paladins/avatar/33653?x=1"), null);
  assert.equal(playerAvatarProxyPath(0, "https://hirez-api.onrender.com/paladins/avatar/0"), null);
});

test("upstream URL is constructed from a validated ID", () => {
  assert.equal(
    playerAvatarUpstreamUrl("33653"),
    "https://hirez-api.onrender.com/paladins/avatar/33653",
  );
});
