import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("ticket pages wait for verified authentication before loading private data", () => {
  const tickets = source("../app/operations/tickets/page.tsx");
  const detail = source("../app/operations/tickets/[id]/page.tsx");
  const wall = source("../components/operations-auth-wall.tsx");
  assert.match(tickets, /if\(isLoading\|\|!user\)return;.*listTickets/s);
  assert.match(detail, /if\(isLoading\|\|!user\)return;.*getTicket/s);
  assert.match(tickets, /if\(!user\)return <OperationsAuthWall\/>/);
  assert.match(detail, /if\(!user\)return <OperationsAuthWall\/>/);
  assert.match(wall, /action="\/api\/auth\/oidc\/login" method="post"/);
  assert.match(wall, /name="return" value=\{pathname\}/);
});

test("ticket and Kanban clients use the shared authenticated transport", () => {
  const api = source("./operations-api.ts");
  for (const operation of ["listTickets", "getTicket", "deleteTicket", "listWorkItems"]) {
    assert.match(api, new RegExp(`function ${operation}\\([\\s\\S]*?headers: auth\\(\\)`));
  }
  const client = source("./api-client.ts");
  assert.match(client, /fetchOptions\.credentials = "same-origin"/);
  assert.match(client, /headers\.set\("X-CSRF-Token", csrf\)/);
});

test("ticket deletion is exposed only through the staff role wall", () => {
  const detail = source("../app/operations/tickets/[id]/page.tsx");
  assert.match(detail, /staff=user\?\.isAdmin\|\|user\?\.isProjectDeveloper/);
  assert.match(detail, /\{staff&&<button[^>]*onClick=\{\(\)=>void remove\(\)\}/);
  assert.match(detail, /await deleteTicket\(id\)/);
});

test("Kanban UI is role-walled before its API request", () => {
  const projects = source("../app/operations/projects/page.tsx");
  assert.match(projects, /isManager = user\?\.isAdmin === true \|\| user\?\.isProjectDeveloper === true/);
  assert.match(projects, /if\(isManager\) void listWorkItems\(\)/);
  assert.match(projects, /if \(!isManager\) return <AccessWall \/>/);
});
