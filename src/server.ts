
import "dotenv/config";

import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap() {
  try {
    await prisma.$connect();

    console.log("Connected to PostgreSQL");

    const server = app.listen(PORT, () => {
      console.log(`LaagGo API running on http://localhost:${PORT}`);
    });

    let isShuttingDown = false;

    const shutdown = (signal: string) => {
      if (isShuttingDown) return;

      isShuttingDown = true;
      console.log(`${signal} received. Shutting down...`);

      server.close(async (error) => {
        try {
          if (error) {
            console.error("HTTP server shutdown error:", error);
            process.exitCode = 1;
          }

          await prisma.$disconnect();
          console.log("Database disconnected");
        } catch (disconnectError) {
          console.error("Database shutdown error:", disconnectError);
          process.exitCode = 1;
        } finally {
          process.exit();
        }
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start LaagGo API:", error);

    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
