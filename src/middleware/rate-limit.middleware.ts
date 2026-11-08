
import { rateLimit } from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

interface RateLimiterOptions {
  windowMs?: number;
  limit: number;
  message: string;
}

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  limit,
  message,
}: RateLimiterOptions) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

export const apiRateLimiter = createRateLimiter({
  limit: isTest ? 1000 : 100,
  message: "Too many requests. Please try again later.",
});

export const authRateLimiter = createRateLimiter({
  limit: isTest ? 1000 : 5,
  message: "Too many authentication attempts. Please try again later.",
});
