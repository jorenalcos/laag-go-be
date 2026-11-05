const fs = require("fs");
const { spawnSync } = require("child_process");

const envFile = fs.readFileSync(".env", "utf8");
const match = envFile.match(/^DATABASE_URL=(.*)$/m);

if (!match) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}

const databaseUrl = match[1].trim().replace(/^["']|["']$/g, "");
const url = new URL(databaseUrl);

url.pathname = "/laaggo_test";
process.env.DATABASE_URL = url.toString();

console.log("Target database:", url.pathname);

const result = spawnSync(
  process.execPath,
  [
    require.resolve("prisma/build/index.js"),
    "migrate",
    "deploy"
  ],
  {
    stdio: "inherit",
    env: process.env
  }
);

if (result.error) {
  console.error("Process launch error:", result.error.message);
  process.exit(1);
}

if (result.signal) {
  console.error("Process terminated by signal:", result.signal);
  process.exit(1);
}

console.log("Prisma exit code:", result.status);
process.exit(result.status ?? 1);