#!/usr/bin/env node
/**
 * Mock API for local structural preview.
 * Returns 200 {} for any request — pages render empty/error states.
 * Usage: node scripts/mock-api.mjs
 * Then: NEXT_SERVER_API_URL=http://127.0.0.1:3304 npm run dev
 */
import http from "node:http";

const port = Number(process.env.MOCK_API_PORT || 3304);

const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end("{}");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[mock-api] listening on http://127.0.0.1:${port} — returns 200 {} for all requests`);
});
