
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ItineraryStatus } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  findOrganizationBySlug: vi.fn(),
  findById: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  addStop: vi.fn(),
  findStop: vi.fn(),
  updateStop: vi.fn(),
  deleteStop: vi.fn(),
}));

vi.mock("../../src/modules/itineraries/itinerary.repository", () => ({
  itineraryRepository: {
    findOrganizationBySlug: mocks.findOrganizationBySlug,
    findById: mocks.findById,
    findMany: mocks.findMany,
    count: mocks.count,
    create: mocks.create,
    update: mocks.update,
    updateStatus: mocks.updateStatus,
    addStop: mocks.addStop,
    findStop: mocks.findStop,
    updateStop: mocks.updateStop,
    deleteStop: mocks.deleteStop,
  },
}));

import {
  itineraryService,
  ItineraryError,
} from "../../src/modules/itineraries/itinerary.service";

const organization = {
  id: "org-001",
  slug: "cj-cebu-adventures",
  status: "ACTIVE",
};

const stop = {
  id: "stop-001",
  dayNumber: 1,
  sortOrder: 1,
  name: "Kawasan Falls",
  description: null,
  location: "Badian, Cebu",
  durationMinutes: 120,
};

const itinerary = {
  id: "itinerary-001",
  organizationId: organization.id,
  name: "South Cebu Adventure",
  description: "A Cebu south tour",
  durationDays: 3,
  status: ItineraryStatus.DRAFT,
  isFeatured: false,
  ItineraryTemplateStop: [stop],
};

const createInput = {
  name: "South Cebu Adventure",
  description: "A Cebu south tour",
  durationDays: 3,
  isFeatured: false,
  stops: [
    {
      dayNumber: 1,
      sortOrder: 1,
      name: "Kawasan Falls",
      location: "Badian, Cebu",
      durationMinutes: 120,
    },
  ],
};

describe("Itinerary Service", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mocks.findOrganizationBySlug.mockResolvedValue(organization);
    mocks.findById.mockResolvedValue(itinerary);
    mocks.findMany.mockResolvedValue([itinerary]);
    mocks.count.mockResolvedValue(1);
    mocks.create.mockResolvedValue(itinerary);
    mocks.update.mockResolvedValue({ count: 1 });
    mocks.updateStatus.mockResolvedValue({ count: 1 });
    mocks.addStop.mockResolvedValue(stop);
    mocks.findStop.mockResolvedValue(stop);
    mocks.updateStop.mockResolvedValue({ count: 1 });
    mocks.deleteStop.mockResolvedValue({ count: 1 });
  });

  describe("create", () => {
    it("should create an itinerary with stops", async () => {
      const result = await itineraryService.create(createInput);

      expect(mocks.findOrganizationBySlug).toHaveBeenCalledWith(
        "cj-cebu-adventures",
      );

      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: organization.id,
          name: createInput.name,
          durationDays: createInput.durationDays,
          status: ItineraryStatus.DRAFT,
        }),
        [
          expect.objectContaining({
            dayNumber: 1,
            name: "Kawasan Falls",
            description: null,
            location: "Badian, Cebu",
            durationMinutes: 120,
          }),
        ],
      );

      expect(result).toEqual(itinerary);
    });

    it("should reject when the default organization is missing", async () => {
      mocks.findOrganizationBySlug.mockResolvedValue(null);

      await expect(
        itineraryService.create(createInput),
      ).rejects.toThrow("The default LaagGo organization is unavailable or inactive");

      expect(mocks.create).not.toHaveBeenCalled();
    });

    it("should reject when the organization is inactive", async () => {
      mocks.findOrganizationBySlug.mockResolvedValue({
        ...organization,
        status: "INACTIVE",
      });

      await expect(
        itineraryService.create(createInput),
      ).rejects.toThrow(ItineraryError);

      expect(mocks.create).not.toHaveBeenCalled();
    });

    it("should reject a stop outside the itinerary duration", async () => {
      const invalidInput = {
        ...createInput,
        stops: [
          {
            ...createInput.stops[0],
            dayNumber: 4,
          },
        ],
      };

      await expect(
        itineraryService.create(invalidInput),
      ).rejects.toThrow("Stop day cannot exceed itinerary duration of 3 days");

      expect(mocks.create).not.toHaveBeenCalled();
    });
  });

  describe("list", () => {
    it("should return itineraries with pagination", async () => {
      const result = await itineraryService.list({
        page: 2,
        limit: 10,
      });

      expect(mocks.findMany).toHaveBeenCalledWith(
        organization.id,
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );

      expect(mocks.count).toHaveBeenCalled();

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it("should apply search and status filters", async () => {
      await itineraryService.list({
        page: 1,
        limit: 20,
        search: "Cebu",
        status: ItineraryStatus.PUBLISHED,
        isFeatured: "true",
      });

      expect(mocks.findMany).toHaveBeenCalledWith(
        organization.id,
        expect.objectContaining({
          search: "Cebu",
          status: ItineraryStatus.PUBLISHED,
          isFeatured: true,
        }),
      );
    });
  });

  describe("getById", () => {
    it("should return an itinerary by ID", async () => {
      const result = await itineraryService.getById("itinerary-001");

      expect(mocks.findById).toHaveBeenCalledWith(
        "itinerary-001",
        organization.id,
      );

      expect(result).toEqual(itinerary);
    });

    it("should throw when the itinerary does not exist", async () => {
      mocks.findById.mockResolvedValue(null);

      await expect(
        itineraryService.getById("missing-id"),
      ).rejects.toThrow("Itinerary not found");
    });
  });

  describe("update", () => {
    it("should update itinerary details", async () => {
      const input = {
        name: "Updated South Cebu Tour",
        isFeatured: true,
      };

      const result = await itineraryService.update(
        "itinerary-001",
        input,
      );

      expect(mocks.update).toHaveBeenCalledWith(
        "itinerary-001",
        organization.id,
        {
          name: input.name,
          isFeatured: true,
        },
      );

      expect(result).toEqual(itinerary);
    });

    it("should reject updates to archived itineraries", async () => {
      mocks.findById.mockResolvedValue({
        ...itinerary,
        status: ItineraryStatus.ARCHIVED,
      });

      await expect(
        itineraryService.update("itinerary-001", {
          name: "Updated name",
        }),
      ).rejects.toThrow("Archived itineraries cannot be updated");

      expect(mocks.update).not.toHaveBeenCalled();
    });

    it("should reject a duration shorter than an existing stop day", async () => {
      mocks.findById.mockResolvedValue({
        ...itinerary,
        ItineraryTemplateStop: [
          {
            ...stop,
            dayNumber: 3,
          },
        ],
      });

      await expect(
        itineraryService.update("itinerary-001", {
          durationDays: 2,
        }),
      ).rejects.toThrow("Stop day cannot exceed itinerary duration of 2 days");

      expect(mocks.update).not.toHaveBeenCalled();
    });
  });

  describe("updateStatus", () => {
    it("should publish an itinerary with at least one stop", async () => {
      await itineraryService.updateStatus(
        "itinerary-001",
        ItineraryStatus.PUBLISHED,
      );

      expect(mocks.updateStatus).toHaveBeenCalledWith(
        "itinerary-001",
        organization.id,
        ItineraryStatus.PUBLISHED,
      );
    });

    it("should reject publishing an itinerary without stops", async () => {
      mocks.findById.mockResolvedValue({
        ...itinerary,
        ItineraryTemplateStop: [],
      });

      await expect(
        itineraryService.updateStatus(
          "itinerary-001",
          ItineraryStatus.PUBLISHED,
        ),
      ).rejects.toThrow(
        "An itinerary must have at least one stop before publishing",
      );

      expect(mocks.updateStatus).not.toHaveBeenCalled();
    });

    it("should reject status changes for archived itineraries", async () => {
      mocks.findById.mockResolvedValue({
        ...itinerary,
        status: ItineraryStatus.ARCHIVED,
      });

      await expect(
        itineraryService.updateStatus(
          "itinerary-001",
          ItineraryStatus.DRAFT,
        ),
      ).rejects.toThrow("Archived itineraries cannot change status");

      expect(mocks.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe("archive", () => {
    it("should archive an itinerary", async () => {
      await itineraryService.archive("itinerary-001");

      expect(mocks.updateStatus).toHaveBeenCalledWith(
        "itinerary-001",
        organization.id,
        ItineraryStatus.ARCHIVED,
      );
    });
  });

  describe("addStop", () => {
    it("should add a stop to an itinerary", async () => {
      await itineraryService.addStop("itinerary-001", {
        dayNumber: 2,
        sortOrder: 1,
        name: "Osmeña Peak",
      });

      expect(mocks.addStop).toHaveBeenCalledWith(
        "itinerary-001",
        expect.objectContaining({
          dayNumber: 2,
          sortOrder: 1,
          name: "Osmeña Peak",
          description: null,
          location: null,
          durationMinutes: null,
        }),
      );
    });

    it("should reject adding stops to archived itineraries", async () => {
      mocks.findById.mockResolvedValue({
        ...itinerary,
        status: ItineraryStatus.ARCHIVED,
      });

      await expect(
        itineraryService.addStop("itinerary-001", {
          dayNumber: 1,
          sortOrder: 1,
          name: "Kawasan Falls",
        }),
      ).rejects.toThrow("Cannot add stops to an archived itinerary");

      expect(mocks.addStop).not.toHaveBeenCalled();
    });

    it("should reject a stop outside the itinerary duration", async () => {
      await expect(
        itineraryService.addStop("itinerary-001", {
          dayNumber: 4,
          sortOrder: 1,
          name: "Osmeña Peak",
        }),
      ).rejects.toThrow("Stop day cannot exceed itinerary duration of 3 days");

      expect(mocks.addStop).not.toHaveBeenCalled();
    });
  });

  describe("updateStop", () => {
    it("should update an existing stop", async () => {
      await itineraryService.updateStop(
        "itinerary-001",
        "stop-001",
        {
          name: "Updated Kawasan Falls",
        },
      );

      expect(mocks.findStop).toHaveBeenCalledWith(
        "stop-001",
        "itinerary-001",
      );

      expect(mocks.updateStop).toHaveBeenCalledWith(
        "stop-001",
        "itinerary-001",
        {
          name: "Updated Kawasan Falls",
        },
      );
    });

    it("should reject updating a missing stop", async () => {
      mocks.findStop.mockResolvedValue(null);

      await expect(
        itineraryService.updateStop(
          "itinerary-001",
          "missing-stop",
          { name: "Updated stop" },
        ),
      ).rejects.toThrow("Itinerary stop not found");

      expect(mocks.updateStop).not.toHaveBeenCalled();
    });

    it("should reject updating stops in archived itineraries", async () => {
      mocks.findById.mockResolvedValue({
        ...itinerary,
        status: ItineraryStatus.ARCHIVED,
      });

      await expect(
        itineraryService.updateStop(
          "itinerary-001",
          "stop-001",
          { name: "Updated stop" },
        ),
      ).rejects.toThrow("Cannot update stops in an archived itinerary");

      expect(mocks.updateStop).not.toHaveBeenCalled();
    });
  });

  describe("deleteStop", () => {
    it("should delete an existing stop", async () => {
      await itineraryService.deleteStop(
        "itinerary-001",
        "stop-001",
      );

      expect(mocks.findStop).toHaveBeenCalledWith(
        "stop-001",
        "itinerary-001",
      );

      expect(mocks.deleteStop).toHaveBeenCalledWith(
        "stop-001",
        "itinerary-001",
      );
    });

    it("should reject deleting a missing stop", async () => {
      mocks.findStop.mockResolvedValue(null);

      await expect(
        itineraryService.deleteStop(
          "itinerary-001",
          "missing-stop",
        ),
      ).rejects.toThrow("Itinerary stop not found");

      expect(mocks.deleteStop).not.toHaveBeenCalled();
    });

    it("should reject deleting stops from archived itineraries", async () => {
      mocks.findById.mockResolvedValue({
        ...itinerary,
        status: ItineraryStatus.ARCHIVED,
      });

      await expect(
        itineraryService.deleteStop(
          "itinerary-001",
          "stop-001",
        ),
      ).rejects.toThrow("Cannot delete stops from an archived itinerary");

      expect(mocks.deleteStop).not.toHaveBeenCalled();
    });
  });
});
