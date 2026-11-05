
import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../src/modules/auth/auth.repository", () => ({
  authRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
  },
}));

import app from "../../src/app";

const JWT_SECRET = "test-only-laaggo-jwt-secret-at-least-32-characters";

const validToken = jwt.sign(
  {
    sub: "test-user-001",
    email: "test@laaggo.com",
  },
  JWT_SECRET,
  { expiresIn: "1h" },
);

describe("POST /api/v1/auth/logout", () => {
  it("should logout successfully with a valid token", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Logout successful. Discard your access token.",
    );
  });

  it("should reject logout without a token", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject logout with an invalid token", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
