const fs = require("fs");
const { spawnSync } = require("child_process");

const envFile = fs.readFileSync(".env", "utf8");
const match = envFile.match(/^DATABASE_URL=(.*)$/m);

if (!match) {
  console.error("DATABASE_URL not found");
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
    "resolve",
    "--applied",
    "0_init"
  ],
  { stdio: "inherit", env: process.env }
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

console.log("Prisma exit code:", result.status);
process.exit(result.status ?? 1);