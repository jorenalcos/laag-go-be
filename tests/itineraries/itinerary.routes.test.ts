
import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  requireAdmin: vi.fn(),
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

vi.mock("../../src/middleware/auth.middleware", () => ({
  authenticate: mocks.authenticate,
}));

vi.mock("../../src/middleware/admin.middleware", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("../../src/modules/itineraries/itinerary.controller", () => ({
  itineraryController: {
    create: mocks.create,
    list: mocks.list,
    getById: mocks.getById,
    update: mocks.update,
    updateStatus: mocks.updateStatus,
    archive: mocks.archive,
    addStop: mocks.addStop,
    updateStop: mocks.updateStop,
    deleteStop: mocks.deleteStop,
  },
}));

import itineraryRoutes from "../../src/modules/itineraries/itinerary.routes";

describe("Itinerary Routes", () => {
  const app = express();

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.authenticate.mockImplementation((_req, _res, next) => next());
    mocks.requireAdmin.mockImplementation((_req, _res, next) => next());

    for (const handler of [
      mocks.create,
      mocks.list,
      mocks.getById,
      mocks.update,
      mocks.updateStatus,
      mocks.archive,
      mocks.addStop,
      mocks.updateStop,
      mocks.deleteStop,
    ]) {
      handler.mockImplementation((_req, res) => {
        return res.status(200).json({ success: true });
      });
    }
  });

  // Register the router for each test.
  const createApp = () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.use("/itineraries", itineraryRoutes);
    return testApp;
  };

  it("should apply authentication middleware", async () => {
    const testApp = createApp();

    await request(testApp).get("/itineraries");

    expect(mocks.authenticate).toHaveBeenCalled();
  });

  it("should apply platform administrator middleware", async () => {
    const testApp = createApp();

    await request(testApp).get("/itineraries");

    expect(mocks.requireAdmin).toHaveBeenCalled();
  });

  it("should register POST /", async () => {
    await request(createApp())
      .post("/itineraries")
      .send({});

    expect(mocks.create).toHaveBeenCalled();
  });

  it("should register GET /", async () => {
    await request(createApp()).get("/itineraries");

    expect(mocks.list).toHaveBeenCalled();
  });

  it("should register GET /:id", async () => {
    await request(createApp()).get("/itineraries/itinerary-001");

    expect(mocks.getById).toHaveBeenCalled();
  });

  it("should register PATCH /:id", async () => {
    await request(createApp())
      .patch("/itineraries/itinerary-001")
      .send({});

    expect(mocks.update).toHaveBeenCalled();
  });

  it("should register PATCH /:id/status", async () => {
    await request(createApp())
      .patch("/itineraries/itinerary-001/status")
      .send({ status: "PUBLISHED" });

    expect(mocks.updateStatus).toHaveBeenCalled();
  });

  it("should register DELETE /:id", async () => {
    await request(createApp()).delete("/itineraries/itinerary-001");

    expect(mocks.archive).toHaveBeenCalled();
  });

  it("should register POST /:id/stops", async () => {
    await request(createApp())
      .post("/itineraries/itinerary-001/stops")
      .send({});

    expect(mocks.addStop).toHaveBeenCalled();
  });

  it("should register PATCH /:id/stops/:stopId", async () => {
    await request(createApp())
      .patch("/itineraries/itinerary-001/stops/stop-001")
      .send({});

    expect(mocks.updateStop).toHaveBeenCalled();
  });

  it("should register DELETE /:id/stops/:stopId", async () => {
    await request(createApp()).delete(
      "/itineraries/itinerary-001/stops/stop-001"
    );

    expect(mocks.deleteStop).toHaveBeenCalled();
  });
});
