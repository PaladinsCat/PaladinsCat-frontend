/** Exercise chat mutation rendering, replay ordering, and history pagination.
 * refs: doc: documents/02-technical/api/community-interactions.md
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

test("mutation adapters return normalized server messages without retrying writes", async () => {
  const requests = [];
  const source = readFileSync(new URL("../lib/community-chat.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => {
    assert.equal(name, "./api-client");
    return {
      getAuthToken: () => null,
      async fetchJson(path, options) {
        requests.push({ path, ...options });
        return { message: { id: "7", revision: "12", user_id: "3", content: options.method === "DELETE" ? "" : "hello", deleted_at: options.method === "DELETE" ? "2026-09-12T00:00:00Z" : null } };
      },
    };
  } });
  const sent = await exports.sendChatMessage("hello");
  const deleted = await exports.deleteChatMessage(7);
  assert.equal(sent.id, 7);
  assert.equal(sent.user_id, 3);
  assert.equal(deleted.revision, 12);
  assert.equal(deleted.content, "");
  assert.ok(deleted.deleted_at);
  assert.deepEqual(requests.map(({ path, method, retries }) => [path, method, retries]), [["/community/chat", "POST", 0], ["/community/chat/7", "DELETE", 0]]);
});

async function setup() {
  const slots = [];
  const effects = [];
  let slot = 0;
  let mounted = false;
  let receiveMessages;
  const requests = [];
  const mutations = [];
  let mutationError = null;
  const sent = { id: 1001, revision: 1001, user_id: 7, content: "hello", deleted_at: null };
  const deleted = { ...sent, revision: 1002, content: "", deleted_at: "2026-09-12T00:00:00Z" };
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
  const jsx = (type, props, key) => ({ type, props, key });
  const mocks = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/link": { default: "a" },
    "@/lib/auth-context": { useAuth: () => ({ user: { id: 7 } }) },
    "@/lib/localization-context": { useLocalization: () => ({ t: (key) => key, formatDateTime: (value) => value }) },
    "@/components/player-name": { VerifiedPlayerBadge: () => null },
    "@/lib/community-chat": {
      normalizeChatMessage: (message) => message,
      async chatHistory(before = 1001) {
        requests.push(before);
        return { cursor: 1000, hasMore: true, messages: Array.from({ length: 50 }, (_, i) => ({ id: before - 50 + i, revision: before - 50 + i, content: "message" })) };
      },
      chatEvents: () => ({ close() {}, addEventListener(_name, handler) { receiveMessages = handler; } }),
      async sendChatMessage(content) {
        mutations.push(["send", content]);
        if (mutationError) throw mutationError;
        return sent;
      },
      async deleteChatMessage(id) {
        mutations.push(["delete", id]);
        if (mutationError) throw mutationError;
        return deleted;
      },
    },
  };
  function load(relativePath) {
    const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
    const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const exports = {};
    vm.runInNewContext(code, { exports, window: { confirm: () => true }, require: (name) => {
      assert.ok(name in mocks, `Unexpected import: ${name}`);
      return mocks[name];
    } });
    return exports;
  }
  mocks["@/lib/chat-messages"] = load("../lib/chat-messages.ts");
  const Component = load("../components/community-chat.tsx").default;
  function render() { slot = 0; return Component(); }
  function find(node, predicate) {
    if (!node || typeof node !== "object") return;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      const found = find(child, predicate);
      if (found) return found;
    }
  }
  render();
  mounted = true;
  const cleanup = effects[0]();
  await new Promise((resolve) => setImmediate(resolve));
  return {
    render, cleanup, requests, mutations, sent, deleted,
    find: (predicate) => find(render(), predicate),
    messages: () => slots[0],
    fail: (error) => { mutationError = error; },
    receive: (rows) => receiveMessages({ data: JSON.stringify(rows) }),
  };
}

test("an old live deletion cannot advance the component's history cursor", async (t) => {
  const ui = await setup();
  t.after(ui.cleanup);
  ui.receive([{ id: 50, revision: 1001, content: "", deleted_at: "2026-09-08T00:00:00Z" }]);
  const olderButton = () => ui.find((node) => node.type === "button" && node.props.children === "community.olderMessages");
  await olderButton().props.onClick();
  await olderButton().props.onClick();
  assert.deepEqual(ui.requests, [1001, 951, 901]);
});

test("confirmed sends and deletions render without SSE and tolerate delayed replay", async (t) => {
  const ui = await setup();
  t.after(ui.cleanup);
  ui.find((node) => node.type === "textarea").props.onChange({ target: { value: " hello " } });
  await ui.find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
  assert.equal(ui.messages().at(-1).content, "hello");
  assert.ok(ui.find((node) => node.type === "article" && node.key === ui.sent.id));
  assert.equal(ui.find((node) => node.type === "textarea").props.value, "");
  assert.deepEqual(ui.mutations, [["send", "hello"]]);
  ui.receive([ui.sent]);
  assert.equal(ui.messages().filter((row) => row.id === ui.sent.id).length, 1);
  await ui.find((node) => node.type === "button" && node.props.children === "generated.community.delete").props.onClick();
  assert.equal(ui.messages().at(-1).deleted_at, ui.deleted.deleted_at);
  assert.equal(ui.find((node) => node.type === "article" && node.key === ui.sent.id), undefined);
  ui.receive([ui.sent, ui.deleted]);
  assert.equal(ui.messages().at(-1).content, "");
  assert.equal(ui.find((node) => node.type === "article" && node.key === ui.sent.id), undefined);
  assert.equal(ui.find((node) => node.type === "p" && node.props.children === "community.messageDeleted"), undefined);
});

test("a room containing only deleted messages renders no entries and shows the empty state", async (t) => {
  const ui = await setup();
  t.after(ui.cleanup);
  ui.receive(ui.messages().map((message) => ({ ...message, revision: message.revision + 1000, content: "", deleted_at: ui.deleted.deleted_at })));
  assert.equal(ui.find((node) => node.type === "article"), undefined);
  assert.ok(ui.find((node) => node.type === "p" && node.props.children === "community.chatEmpty"));
});

test("failed mutations preserve draft and visible messages", async (t) => {
  const ui = await setup();
  t.after(ui.cleanup);
  ui.receive([ui.sent]);
  ui.fail(new Error("Request failed"));
  ui.find((node) => node.type === "textarea").props.onChange({ target: { value: "keep draft" } });
  await ui.find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
  assert.equal(ui.find((node) => node.type === "textarea").props.value, "keep draft");
  await ui.find((node) => node.type === "button" && node.props.children === "generated.community.delete").props.onClick();
  assert.equal(ui.messages().at(-1).deleted_at, null);
  assert.equal(ui.messages().at(-1).content, "hello");
});
