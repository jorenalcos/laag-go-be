import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import apiRoutes from "./routes";
import { errorMiddleware } from "./middleware/error.middleware";
import { apiRateLimiter } from "./middleware/rate-limit.middleware";

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (e.g. server-to-server).
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
  }),
);
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "LaagGo API",
    version: "1.0.0",
  });
});

app.use("/api/v1", apiRateLimiter, apiRoutes);

app.use(errorMiddleware);

export default app;