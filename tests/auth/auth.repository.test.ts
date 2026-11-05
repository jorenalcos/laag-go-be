
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { authRepository } from "../../src/modules/auth/auth.repository";

describe("Auth Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findByEmail", () => {
    it("should find a user by email", async () => {
      const mockUser = {
        id: "user-001",
        email: "test@laaggo.com",
        passwordHash: "hashed-password",
        status: "ACTIVE",
      };

      mockFindUnique.mockResolvedValue(mockUser);

      const result = await authRepository.findByEmail(
        "test@laaggo.com",
      );

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          email: "test@laaggo.com",
        },
      });

      expect(result).toEqual(mockUser);
    });

    it("should return null when the user does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await authRepository.findByEmail(
        "unknown@laaggo.com",
      );

      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("should find a user by ID with selected fields", async () => {
      const mockUser = {
        id: "user-001",
        name: "Test User",
        email: "test@laaggo.com",
        phone: "09123456789",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindUnique.mockResolvedValue(mockUser);

      const result = await authRepository.findById("user-001");

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          id: "user-001",
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual(mockUser);
    });

    it("should return null when the user ID does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await authRepository.findById("unknown-user");

      expect(result).toBeNull();
    });
  });
});
