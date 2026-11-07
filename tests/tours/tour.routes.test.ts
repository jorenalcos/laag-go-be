
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const mockTourService = vi.hoisted(() => ({
  listPublic: vi.fn(),
  getPublicBySlug: vi.fn(),
}));

vi.mock("../../src/modules/tours/tour.service", () => ({
  tourService: mockTourService,
  TourError: class TourError extends Error {
    constructor(
      message: string,
      public statusCode: number,
    ) {
      super(message);
      this.name = "TourError";
    }
  },
}));

import app from "../../src/app";

describe("Tour API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/public/tours", () => {
    it("should return published tours", async () => {
      mockTourService.listPublic.mockResolvedValue({
        items: [
          {
            id: "tour-001",
            title: "Cebu South Tour",
            slug: "cebu-south-tour",
            status: "PUBLISHED",
          },
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 1,
          totalPages: 1,
        },
      });

      const response = await request(app)
        .get("/api/v1/public/tours");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);

      expect(mockTourService.listPublic).toHaveBeenCalledWith({
        page: 1,
        limit: 12,
      });
    });

    it("should reject invalid query parameters", async () => {
      const response = await request(app)
        .get("/api/v1/public/tours?page=invalid");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      expect(mockTourService.listPublic).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/public/tours/:slug", () => {
    it("should return a published tour by slug", async () => {
      mockTourService.getPublicBySlug.mockResolvedValue({
        id: "tour-001",
        title: "Cebu South Tour",
        slug: "cebu-south-tour",
        status: "PUBLISHED",
      });

      const response = await request(app)
        .get("/api/v1/public/tours/cebu-south-tour");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tour.slug).toBe("cebu-south-tour");

      expect(
        mockTourService.getPublicBySlug,
      ).toHaveBeenCalledWith("cebu-south-tour");
    });
  });

  describe("Protected tour routes", () => {
    it("should reject unauthenticated tour requests", async () => {
      const response = await request(app)
        .get("/api/v1/tours");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
