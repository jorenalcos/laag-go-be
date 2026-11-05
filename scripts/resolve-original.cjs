const fs = require("fs");
const { spawnSync } = require("child_process");

const match = fs.readFileSync(".env", "utf8")
  .match(/^DATABASE_URL=(.*)$/m);

if (!match) {
  throw new Error("DATABASE_URL not found");
}

const url = new URL(
  match[1].trim().replace(/^["']|["']$/g, "")
);

url.pathname = "/laaggo";

console.log("Target database:", url.pathname);

const result = spawnSync(
  process.execPath,
  [
    require.resolve("prisma/build/index.js"),
    "migrate",
    "resolve",
    "--applied",
    "0_init"
  ],
  {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url.toString() }
  }
);

if (result.error) throw result.error;

console.log("Prisma exit code:", result.status);
process.exit(result.status ?? 1);