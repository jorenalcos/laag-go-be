
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";

const JWT_SECRET = "test-secret-for-auth-middleware";

function createMocks(authorization?: string) {
  const req = {
    headers: authorization ? { authorization } : {},
    user: undefined,
  } as any;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;

  const next = vi.fn();

  return { req, res, next };
}

describe("Authentication Middleware", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("JWT_SECRET", JWT_SECRET);
  });

  it("should reject requests without authorization", async () => {
    const { authenticate } = await import(
      "../../src/middleware/auth.middleware"
    );

    const { req, res, next } = createMocks();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject malformed authorization headers", async () => {
    const { authenticate } = await import(
      "../../src/middleware/auth.middleware"
    );

    const { req, res, next } = createMocks("Basic abc123");

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject invalid tokens", async () => {
    const { authenticate } = await import(
      "../../src/middleware/auth.middleware"
    );

    const { req, res, next } = createMocks("Bearer invalid-token");

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject expired tokens", async () => {
    const token = jwt.sign(
      { email: "admin@laaggo.com" },
      JWT_SECRET,
      { subject: "user-123", expiresIn: -1 }
    );

    const { authenticate } = await import(
      "../../src/middleware/auth.middleware"
    );

    const { req, res, next } = createMocks(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject tokens with invalid payload", async () => {
    const token = jwt.sign(
      { email: "admin@laaggo.com" },
      JWT_SECRET
    );

    const { authenticate } = await import(
      "../../src/middleware/auth.middleware"
    );

    const { req, res, next } = createMocks(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should authenticate a valid token", async () => {
    const token = jwt.sign(
      { email: "admin@laaggo.com" },
      JWT_SECRET,
      { subject: "user-123" }
    );

    const { authenticate } = await import(
      "../../src/middleware/auth.middleware"
    );

    const { req, res, next } = createMocks(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(req.user).toEqual({
      id: "user-123",
      email: "admin@laaggo.com",
    });

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 500 when JWT_SECRET is missing", async () => {
    vi.stubEnv("JWT_SECRET", "");

    const { authenticate } = await import(
      "../../src/middleware/auth.middleware"
    );

    const { req, res, next } = createMocks();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});
