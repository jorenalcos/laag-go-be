
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../src/middleware/auth.middleware";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("../../src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
    },
  },
}));

import { requireAdmin } from "../../src/middleware/admin.middleware";

function mockResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res as unknown as Response;
}

function mockRequest(
  user?: { id: string; email: string },
) {
  return {
    user,
  } as AuthRequest;
}

describe("Admin Middleware", () => {
  let res: Response;
  let next: NextFunction;

  const originalAdminEmails = process.env.ADMIN_EMAILS;

  beforeEach(() => {
    vi.clearAllMocks();

    process.env.ADMIN_EMAILS = "admin@laaggo.com";

    res = mockResponse();
    next = vi.fn();
  });

  it("should reject unauthenticated requests", async () => {
    const req = mockRequest();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject when admin emails are not configured", async () => {
    const original = process.env.ADMIN_EMAILS;

    try {
      process.env.ADMIN_EMAILS = "";

      vi.resetModules();

      const { requireAdmin: middlewareWithoutAdmins } =
        await import("../../src/middleware/admin.middleware");

      const req = mockRequest({
        id: "user-001",
        email: "admin@laaggo.com",
      });

      await middlewareWithoutAdmins(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Platform administrator access is not configured",
      });

      expect(mockFindUnique).not.toHaveBeenCalled();
    } finally {
      process.env.ADMIN_EMAILS = original ?? "";
      vi.resetModules();
    }
  });

  it("should reject users not included in ADMIN_EMAILS", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-002",
      email: "user@laaggo.com",
      status: "ACTIVE",
    });

    const req = mockRequest({
      id: "user-002",
      email: "user@laaggo.com",
    });

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Platform administrator access required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject users that do not exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = mockRequest({
      id: "user-003",
      email: "admin@laaggo.com",
    });

    await requireAdmin(req, res, next);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "user-003" },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject inactive administrators", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-001",
      email: "admin@laaggo.com",
      status: "INACTIVE",
    });

    const req = mockRequest({
      id: "user-001",
      email: "admin@laaggo.com",
    });

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow an active platform administrator", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-001",
      email: "admin@laaggo.com",
      status: "ACTIVE",
    });

    const req = mockRequest({
      id: "user-001",
      email: "admin@laaggo.com",
    });

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should handle database errors through next", async () => {
    const error = new Error("Database connection failed");

    mockFindUnique.mockRejectedValue(error);

    const req = mockRequest({
      id: "user-001",
      email: "admin@laaggo.com",
    });

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  afterAll(() => {
    if (originalAdminEmails === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = originalAdminEmails;
    }
  });
});
  