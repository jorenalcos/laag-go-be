
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";

const { mockFindByEmail } = vi.hoisted(() => ({
  mockFindByEmail: vi.fn(),
}));

vi.mock("../../src/modules/auth/auth.repository", () => ({
  authRepository: {
    findByEmail: mockFindByEmail,
    findById: vi.fn(),
  },
}));

import app from "../../src/app";

describe("POST /api/v1/auth/login", () => {
  const password = "TestPassword123!";
  let activeUser: Record<string, unknown>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const passwordHash = await bcrypt.hash(password, 4);

    activeUser = {
      id: "test-user-001",
      name: "Test User",
      email: "test@laaggo.com",
      phone: "09123456789",
      status: "ACTIVE",
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  it("should login successfully with valid credentials", async () => {
    mockFindByEmail.mockResolvedValue(activeUser);

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "test@laaggo.com",
        password,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.tokenType).toBe("Bearer");
    expect(response.body.data.user.email).toBe("test@laaggo.com");

    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  it("should reject an incorrect password", async () => {
    mockFindByEmail.mockResolvedValue(activeUser);

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "test@laaggo.com",
        password: "WrongPassword123!",
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject an unknown email", async () => {
    mockFindByEmail.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "unknown@laaggo.com",
        password,
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject an inactive account", async () => {
    mockFindByEmail.mockResolvedValue({
      ...activeUser,
      status: "INACTIVE",
    });

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "test@laaggo.com",
        password,
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("should reject an invalid email", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "invalid-email",
        password,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should reject a missing password", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "test@laaggo.com",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should normalize email addresses before lookup", async () => {
    mockFindByEmail.mockResolvedValue(activeUser);

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "  TEST@LAAGGO.COM  ",
        password,
      });

    expect(response.status).toBe(200);
    expect(mockFindByEmail).toHaveBeenCalledWith("test@laaggo.com");
  });
});
