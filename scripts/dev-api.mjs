/**
 * Run uvicorn with reload excludes so SQLite / WAL files don't restart the API in a loop.
 * Usage: node scripts/dev-api.mjs  (from repo root)
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const py =
  process.platform === "win32"
    ? path.join(root, ".venv", "Scripts", "python.exe")
    : path.join(root, ".venv", "bin", "python");

const args = [
  "-m",
  "uvicorn",
  "apps.api.main:app",
  "--reload",
  "--host",
  "127.0.0.1",
  "--port",
  "8000",
  "--reload-delay",
  "1",
  "--reload-exclude",
  "*.db",
  "--reload-exclude",
  "**/*.db",
  "--reload-exclude",
  "*.sqlite*",
];

const child = spawn(py, args, {
  cwd: root,
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => process.exit(code ?? 0));