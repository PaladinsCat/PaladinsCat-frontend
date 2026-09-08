/** Browser-free regression for history pagination after a live moderation event.
 * refs: doc: documents/02-technical/api/community-interactions.md
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

test("an old live deletion cannot advance the component's history cursor", async () => {
  const slots = [];
  const effects = [];
  let slot = 0;
  let mounted = false;
  let receiveMessages;
  const requests = [];
  const react = {
    useState(initial) {
      const index = slot++;
      if (!mounted) slots[index] = initial;
      return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = slot++;
      if (!mounted) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(effect) { if (!mounted) effects.push(effect); },
  };
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/link": { default: "a" },
    "@/lib/auth-context": { useAuth: () => ({ user: null }) },
    "@/lib/localization-context": { useLocalization: () => ({ t: (key) => key, formatDateTime: (value) => value }) },
    "@/components/player-name": { VerifiedPlayerBadge: () => null },
    "@/lib/community-chat": {
      normalizeChatMessage: (message) => message,
      async chatHistory(before = 1001) {
        requests.push(before);
        return { cursor: 1000, hasMore: true, messages: Array.from({ length: 50 }, (_, i) => ({ id: before - 50 + i, revision: before - 50 + i, content: "message" })) };
      },
      chatEvents: () => ({ close() {}, addEventListener(_name, handler) { receiveMessages = handler; } }),
    },
  };
  function load(relativePath) {
    const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const exports = {};
    vm.runInNewContext(code, { exports, require: (name) => {
      assert.ok(name in mocks, `Unexpected import: ${name}`);
      return mocks[name];
    } });
    return exports;
  }
  mocks["@/lib/chat-messages"] = load("../lib/chat-messages.ts");
  const Component = load("../components/community-chat.tsx").default;
  function render() { slot = 0; return Component(); }
  function olderButton(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "button" && node.props.children === "community.olderMessages") return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      const found = olderButton(child);
      if (found) return found;
    }
  }
  render();
  mounted = true;
  const cleanup = effects[0]();
  await new Promise((resolve) => setImmediate(resolve));
  receiveMessages({ data: JSON.stringify([{ id: 50, revision: 1001, content: "", deleted_at: "2026-09-08T00:00:00Z" }]) });
  await olderButton(render()).props.onClick();
  await olderButton(render()).props.onClick();
  assert.deepEqual(requests, [1001, 951, 901]);
  cleanup();
});
