
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  list: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  archive: vi.fn(),
  addStop: vi.fn(),
  updateStop: vi.fn(),
  deleteStop: vi.fn(),
}));

vi.mock("../../src/modules/itineraries/itinerary.service", () => ({
  itineraryService: mocks,
  ItineraryError: class ItineraryError extends Error {
    constructor(
      message: string,
      public statusCode: number,
    ) {
      super(message);
      this.name = "ItineraryError";
    }
  },
}));

vi.mock("../../src/modules/itineraries/itinerary.validation", () => {
  const success = (data: unknown) => ({
    success: true,
    data,
  });

  return {
    createItinerarySchema: { safeParse: success },
    updateItinerarySchema: { safeParse: success },
    updateItineraryStatusSchema: { safeParse: success },
    createItineraryStopSchema: { safeParse: success },
    updateItineraryStopSchema: { safeParse: success },
    itineraryParamsSchema: {
      safeParse: (data: any) =>
        data?.id ? success(data) : { success: false, error: { flatten: () => ({}) } },
    },
    itineraryStopParamsSchema: {
      safeParse: (data: any) =>
        data?.id && data?.stopId
          ? success(data)
          : { success: false, error: { flatten: () => ({}) } },
    },
    listItinerariesQuerySchema: { safeParse: success },
  };
});

import { itineraryController } from "../../src/modules/itineraries/itinerary.controller";

function createResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
}

function createRequest(data: {
  body?: any;
  params?: any;
  query?: any;
} = {}) {
  return {
    body: data.body ?? {},
    params: data.params ?? {},
    query: data.query ?? {},
  };
}

describe("Itinerary Controller", () => {
  let res: ReturnType<typeof createResponse>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    res = createResponse();
    next = vi.fn();
  });

  describe("create", () => {
    it("should create an itinerary", async () => {
      const itinerary = { id: "itinerary-001", name: "South Cebu Tour" };
      mocks.create.mockResolvedValue(itinerary);

      await itineraryController.create(
        createRequest({ body: { name: "South Cebu Tour" } }) as Request,
        res as unknown as Response,
        next,
      );

      expect(mocks.create).toHaveBeenCalledWith({
        name: "South Cebu Tour",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { itinerary },
        }),
      );
    });
  });

  describe("list", () => {
    it("should return itineraries", async () => {
      const result = {
        items: [{ id: "itinerary-001" }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      mocks.list.mockResolvedValue(result);

      await itineraryController.list(
        createRequest({ query: { page: "1", limit: "10" } }) as Request,
        res as unknown as Response,
        next,
      );

      expect(mocks.list).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
      });
    });
  });

  describe("getById", () => {
    it("should return an itinerary", async () => {
      const itinerary = { id: "itinerary-001" };
      mocks.getById.mockResolvedValue(itinerary);

      await itineraryController.getById(
        createRequest({ params: { id: "itinerary-001" } }) as Request,
        res as unknown as Response,
        next,
      );

      expect(mocks.getById).toHaveBeenCalledWith("itinerary-001");
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("update", () => {
    it("should update an itinerary", async () => {
      const itinerary = { id: "itinerary-001", name: "Updated Tour" };
      mocks.update.mockResolvedValue(itinerary);

      await itineraryController.update(
        createRequest({
          params: { id: "itinerary-001" },
          body: { name: "Updated Tour" },
        }) as Request,
        res as unknown as Response,
        next,
      );

      expect(mocks.update).toHaveBeenCalledWith(
        "itinerary-001",
        { name: "Updated Tour" },
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateStatus", () => {
    it("should update itinerary status", async () => {
      mocks.updateStatus.mockResolvedValue({ id: "itinerary-001", status: "PUBLISHED" });

      await itineraryController.updateStatus(
        createRequest({
          params: { id: "itinerary-001" },
          body: { status: "PUBLISHED" },
        }) as Request,
        res as unknown as Response,
        next,
      );

      expect(mocks.updateStatus).toHaveBeenCalledWith(
        "itinerary-001",
        "PUBLISHED",
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("archive", () => {
    it("should archive an itinerary", async () => {
      mocks.archive.mockResolvedValue({ id: "itinerary-001", status: "ARCHIVED" });

      await itineraryController.archive(
        createRequest({ params: { id: "itinerary-001" } }) as Request,
        res as unknown as Response,
        next,
      );

      expect(mocks.archive).toHaveBeenCalledWith("itinerary-001");
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("addStop", () => {
    it("should add an itinerary stop", async () => {
      mocks.addStop.mockResolvedValue({ id: "itinerary-001" });

      await itineraryController.addStop(
        createRequest({
          params: { id: "itinerary-001" },
          body: { dayNumber: 1, name: "Kawasan Falls" },
        }) as Request,
        res as unknown as Response,
        next,
      );

      expect(mocks.addStop).toHaveBeenCalledWith(
        "itinerary-001",
        { dayNumber: 1, name: "Kawasan Falls" },
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateStop", () => {
    it("should update an itinerary stop", async () => {
      mocks.updateStop.mockResolvedValue({ id: "itinerary-001" });

      await itineraryController.updateStop(
        createRequest({
          params: {
            id: "itinerary-001",
            stopId: "stop-001",
          },
          body: { name: "Updated Stop" },
        }) as Request,
        res as unknown as Response,
        next,
      );

      expect(mocks.updateStop).toHaveBeenCalledWith(
        "itinerary-001",
        "stop-001",
        { name: "Updated Stop" },
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteStop", () => {
    it("should delete an itinerary stop", async () => {
      mocks.deleteStop.mockResolvedValue({ id: "itinerary-001" });

      await itineraryController.deleteStop(
        createRequest({
          params: {
            id: "itinerary-001",
            stopId: "stop-001",
          },
        }) as Request,
        res as unknown as Response,
        next,
      );

      expect(mocks.deleteStop).toHaveBeenCalledWith(
        "itinerary-001",
        "stop-001",
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("error handling", () => {
    it("should pass unexpected errors to next middleware", async () => {
      const error = new Error("Unexpected database error");
      mocks.getById.mockRejectedValue(error);

      await itineraryController.getById(
        createRequest({ params: { id: "itinerary-001" } }) as Request,
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
