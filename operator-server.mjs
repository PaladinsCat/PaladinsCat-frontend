/** Production entrypoint for the isolated private operator frontend. */
import { readFileSync } from "node:fs";
import next from "next";
import { createOperatorServer } from "./lib/operator-server-core.mjs";

const bind = process.env.PALADINSCAT_OPERATOR_BIND || "0.0.0.0";
if (!["0.0.0.0", "127.0.0.1"].includes(bind)) throw new Error("Invalid operator bind address");
const conf = JSON.parse(readFileSync(new URL("./.next/required-server-files.json", import.meta.url), "utf8")).config;
if (conf.output === "standalone") throw new Error("Operator custom server requires the complete Next runtime");
const app = next({ dev: false, conf });
await app.prepare();
const server = createOperatorServer(app.getRequestHandler());
server.listen(3443, bind, () => console.log("OPERATOR_BFF_READY"));
let stopping = false;
function shutdown() {
  if (stopping) return; stopping = true;
  const deadline = setTimeout(() => { server.closeAllConnections(); process.exitCode = 1; }, 15000);
  deadline.unref();
  server.close(async () => { clearTimeout(deadline); await app.close(); });
  server.closeIdleConnections();
}
process.on("SIGTERM", shutdown); process.on("SIGINT", shutdown);
