
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const { mockFindById } = vi.hoisted(() => ({
  mockFindById: vi.fn(),
}));

vi.mock("../../src/modules/auth/auth.repository", () => ({
  authRepository: {
    findByEmail: vi.fn(),
    findById: mockFindById,
  },
}));

import app from "../../src/app";

const JWT_SECRET = "test-only-laaggo-jwt-secret-at-least-32-characters";

describe("GET /api/v1/auth/me", () => {
  const user = {
    id: "test-user-001",
    name: "Test User",
    email: "test@laaggo.com",
    phone: "09123456789",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createToken = (payload = {
    sub: user.id,
    email: user.email,
  }) => jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindById.mockResolvedValue(user);
  });

  it("should return the authenticated user", async () => {
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(user.email);
    expect(mockFindById).toHaveBeenCalledWith(user.id);
  });

  it("should reject a request without a token", async () => {
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject an invalid token", async () => {
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject an expired token", async () => {
    const expiredToken = jwt.sign(
      { sub: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: -1 },
    );

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject a token with an invalid payload", async () => {
    const invalidToken = jwt.sign(
      { sub: 123, email: user.email },
      JWT_SECRET,
    );

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${invalidToken}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject an unknown user", async () => {
    mockFindById.mockResolvedValue(null);

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject an inactive user", async () => {
    mockFindById.mockResolvedValue({
      ...user,
      status: "INACTIVE",
    });

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${createToken()}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
