
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

const { mockTourService } = vi.hoisted(() => ({
  mockTourService: {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    archive: vi.fn(),
    listPublic: vi.fn(),
    getPublicBySlug: vi.fn(),
  },
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

import { tourController } from "../../src/modules/tours/tour.controller";

function mockResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res as unknown as Response;
}

function mockRequest(data: {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
} = {}) {
  return {
    body: data.body ?? {},
    params: data.params ?? {},
    query: data.query ?? {},
  } as Request;
}

describe("Tour Controller", () => {
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockResponse();
    next = vi.fn();
  });

  describe("create", () => {
    it("should create a tour successfully", async () => {
      const tour = { id: "tour-001", title: "Cebu South Tour" };
      mockTourService.create.mockResolvedValue(tour);

      await tourController.create(
        mockRequest({
          body: {
            title: "Cebu South Tour",
            priceBasis: "CUSTOM_QUOTE",
          },
        }),
        res,
        next,
      );

      expect(mockTourService.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Tour created successfully",
        data: { tour },
      });
    });

    it("should return 400 for invalid input", async () => {
      await tourController.create(
        mockRequest({ body: {} }),
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockTourService.create).not.toHaveBeenCalled();
    });

    it("should forward service errors", async () => {
      const error = new Error("Unexpected error");
      mockTourService.create.mockRejectedValue(error);

      await tourController.create(
        mockRequest({
          body: {
            title: "Cebu South Tour",
            priceBasis: "CUSTOM_QUOTE",
          },
        }),
        res,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("list", () => {
    it("should return tours successfully", async () => {
      const result = { items: [], pagination: { total: 0 } };
      mockTourService.list.mockResolvedValue(result);

      await tourController.list(mockRequest(), res, next);

      expect(mockTourService.list).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
      });
    });

    it("should reject invalid query parameters", async () => {
      await tourController.list(
        mockRequest({ query: { page: "0" } }),
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockTourService.list).not.toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should return a tour successfully", async () => {
      const tour = { id: "tour-001" };
      mockTourService.getById.mockResolvedValue(tour);

      await tourController.getById(
        mockRequest({ params: { id: "tour-001" } }),
        res,
        next,
      );

      expect(mockTourService.getById).toHaveBeenCalledWith("tour-001");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should reject an invalid tour ID", async () => {
      await tourController.getById(
        mockRequest({ params: { id: "" } }),
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockTourService.getById).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update a tour successfully", async () => {
      const tour = { id: "tour-001", title: "Updated Cebu Tour" };
      mockTourService.update.mockResolvedValue(tour);

      await tourController.update(
        mockRequest({
          params: { id: "tour-001" },
          body: { title: "Updated Cebu Tour" },
        }),
        res,
        next,
      );

      expect(mockTourService.update).toHaveBeenCalledWith(
        "tour-001",
        { title: "Updated Cebu Tour" },
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should reject invalid parameters or body", async () => {
      await tourController.update(
        mockRequest({
          params: { id: "tour-001" },
          body: {},
        }),
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockTourService.update).not.toHaveBeenCalled();
    });
  });

  describe("updateStatus", () => {
    it("should update tour status successfully", async () => {
      const tour = { id: "tour-001", status: "PUBLISHED" };
      mockTourService.updateStatus.mockResolvedValue(tour);

      await tourController.updateStatus(
        mockRequest({
          params: { id: "tour-001" },
          body: { status: "PUBLISHED" },
        }),
        res,
        next,
      );

      expect(mockTourService.updateStatus).toHaveBeenCalledWith(
        "tour-001",
        "PUBLISHED",
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should reject an invalid status", async () => {
      await tourController.updateStatus(
        mockRequest({
          params: { id: "tour-001" },
          body: { status: "INVALID" },
        }),
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockTourService.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe("archive", () => {
    it("should archive a tour successfully", async () => {
      const tour = { id: "tour-001", status: "ARCHIVED" };
      mockTourService.archive.mockResolvedValue(tour);

      await tourController.archive(
        mockRequest({ params: { id: "tour-001" } }),
        res,
        next,
      );

      expect(mockTourService.archive).toHaveBeenCalledWith("tour-001");
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("listPublic", () => {
    it("should return public tours successfully", async () => {
      const result = { items: [], pagination: { total: 0 } };
      mockTourService.listPublic.mockResolvedValue(result);

      await tourController.listPublic(mockRequest(), res, next);

      expect(mockTourService.listPublic).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should reject invalid public query parameters", async () => {
      await tourController.listPublic(
        mockRequest({ query: { page: "0" } }),
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockTourService.listPublic).not.toHaveBeenCalled();
    });
  });

  describe("getPublicBySlug", () => {
    it("should return a published tour by slug", async () => {
      const tour = { id: "tour-001", slug: "cebu-south-tour" };
      mockTourService.getPublicBySlug.mockResolvedValue(tour);

      await tourController.getPublicBySlug(
        mockRequest({
          params: { slug: "cebu-south-tour" },
        }),
        res,
        next,
      );

      expect(mockTourService.getPublicBySlug).toHaveBeenCalledWith(
        "cebu-south-tour",
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should reject a missing slug", async () => {
      await tourController.getPublicBySlug(
        mockRequest({ params: {} }),
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockTourService.getPublicBySlug).not.toHaveBeenCalled();
    });
  });
});
