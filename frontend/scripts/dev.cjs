const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const frontendRoot = fs.realpathSync.native(path.join(__dirname, ".."));
process.chdir(frontendRoot);

const nextBin = require.resolve("next/dist/bin/next", {
  paths: [frontendRoot],
});

const args = [nextBin, "dev", "--webpack", ...process.argv.slice(2)];
const child = spawn(process.execPath, args, {
  cwd: frontendRoot,
  env: {
    ...process.env,
    INIT_CWD: frontendRoot,
  },
  stdio: "inherit",
  windowsHide: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
