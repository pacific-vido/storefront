import { spawn } from "node:child_process";
import path from "node:path";
import { prepareStandalone } from "./prepare-standalone.mjs";

prepareStandalone();

const standalone = path.join(process.cwd(), ".next", "standalone");
const child = spawn(process.execPath, ["server.js"], {
  cwd: standalone,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "production",
    HOSTNAME: "0.0.0.0",
    PORT: process.env.PORT ?? "3000",
  },
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
