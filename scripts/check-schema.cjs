
require("dotenv").config();

const { spawnSync } = require("child_process");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing from .env");
}

const result = spawnSync(
  "npx.cmd",
  [
    "prisma",
    "migrate",
    "diff",
    "--from-url",
    databaseUrl,
    "--to-schema-datamodel",
    "prisma/schema.prisma",
    "--script",
  ],
  {
    stdio: "inherit",
    env: process.env,
    shell: true,
  }
);

process.exit(result.status ?? 1);
