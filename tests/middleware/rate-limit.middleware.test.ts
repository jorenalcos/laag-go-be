
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createRateLimiter } from "../../src/middleware/rate-limit.middleware";

describe("Rate Limit Middleware", () => {
  it("should allow requests within the configured limit", async () => {
    const app = express();

    app.use(
      createRateLimiter({
        windowMs: 60_000,
        limit: 2,
        message: "Too many requests.",
      }),
    );

    app.get("/test", (_req, res) => {
      res.status(200).json({ success: true });
    });

    const firstRequest = await request(app).get("/test");
    const secondRequest = await request(app).get("/test");

    expect(firstRequest.status).toBe(200);
    expect(secondRequest.status).toBe(200);
  });

  it("should return 429 when the request limit is exceeded", async () => {
    const app = express();

    app.use(
      createRateLimiter({
        windowMs: 60_000,
        limit: 2,
        message: "Too many requests.",
      }),
    );

    app.get("/test", (_req, res) => {
      res.status(200).json({ success: true });
    });

    await request(app).get("/test");
    await request(app).get("/test");

    const response = await request(app).get("/test");

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      success: false,
      message: "Too many requests.",
    });
  });

  it("should maintain independent rate-limit counters", async () => {
    const firstApp = express();
    const secondApp = express();

    firstApp.use(
      createRateLimiter({
        windowMs: 60_000,
        limit: 1,
        message: "First limiter exceeded.",
      }),
    );

    secondApp.use(
      createRateLimiter({
        windowMs: 60_000,
        limit: 1,
        message: "Second limiter exceeded.",
      }),
    );

    firstApp.get("/test", (_req, res) => res.sendStatus(200));
    secondApp.get("/test", (_req, res) => res.sendStatus(200));

    await request(firstApp).get("/test");

    const response = await request(secondApp).get("/test");

    expect(response.status).toBe(200);
  });
});
