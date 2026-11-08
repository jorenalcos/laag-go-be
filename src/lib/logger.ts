
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  // Hide sensitive information from logs
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['set-cookie']",
      "req.headers['x-api-key']",
      "res.headers['set-cookie']",
      "req.body.password",
      "req.body.confirmPassword",
      "req.body.token",
      "req.body.accessToken",
      "req.body.refreshToken",
    ],
    censor: "[REDACTED]",
  },

  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});
