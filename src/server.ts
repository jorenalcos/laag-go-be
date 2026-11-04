import "dotenv/config";

import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap() {
  try {
    await prisma.$connect();

    console.log("Connected to PostgreSQL");

    app.listen(PORT, () => {
      console.log(`LaagGo API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start LaagGo API:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});