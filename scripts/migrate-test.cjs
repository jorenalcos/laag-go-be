require("dotenv").config();

const { execSync } = require("child_process");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing from .env");
  }

  const testUrl = new URL(process.env.DATABASE_URL);
  testUrl.pathname = "/laaggo_test";

  console.log("Target database: laaggo_test");

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: testUrl.toString(),
    },
  });
}

main().catch((error) => {
  console.error("Test database migration failed:", error.message);
  process.exitCode = 1;
});