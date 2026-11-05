
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    organization: {
      findUnique: vi.fn(),
    },
    tour: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    itineraryTemplate: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("../../src/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { tourRepository } from "../../src/modules/tours/tour.repository";

describe("Tour Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findOrganizationBySlug", () => {
    it("should find an organization by slug", async () => {
      const organization = { id: "org-001", slug: "cj-cebu-adventures" };
      mockPrisma.organization.findUnique.mockResolvedValue(organization);

      const result = await tourRepository.findOrganizationBySlug(
        "cj-cebu-adventures",
      );

      expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
        where: { slug: "cj-cebu-adventures" },
      });
      expect(result).toEqual(organization);
    });
  });

  describe("findBySlug", () => {
    it("should find a tour by organization and slug", async () => {
      const tour = { id: "tour-001", slug: "cebu-south-tour" };
      mockPrisma.tour.findUnique.mockResolvedValue(tour);

      const result = await tourRepository.findBySlug(
        "org-001",
        "cebu-south-tour",
      );

      expect(mockPrisma.tour.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId_slug: {
            organizationId: "org-001",
            slug: "cebu-south-tour",
          },
        },
      });
      expect(result).toEqual(tour);
    });
  });

  describe("findById", () => {
    it("should find a tour with its itinerary template", async () => {
      const tour = { id: "tour-001", title: "Cebu South Tour" };
      mockPrisma.tour.findFirst.mockResolvedValue(tour);

      const result = await tourRepository.findById(
        "tour-001",
        "org-001",
      );

      expect(mockPrisma.tour.findFirst).toHaveBeenCalledWith({
        where: {
          id: "tour-001",
          organizationId: "org-001",
        },
        include: {
          ItineraryTemplate: {
            include: {
              ItineraryTemplateStop: {
                orderBy: [
                  { dayNumber: "asc" },
                  { sortOrder: "asc" },
                ],
              },
            },
          },
        },
      });

      expect(result).toEqual(tour);
    });
  });

  describe("findMany", () => {
    it("should return tours with filters and pagination", async () => {
      const tours = [{ id: "tour-001" }];

      mockPrisma.tour.findMany.mockResolvedValue(tours);

      const filters = {
        skip: 0,
        take: 10,
        search: "Cebu",
        status: "DRAFT" as never,
        priceBasis: "PER_PERSON" as never,
      };

      const result = await tourRepository.findMany(
        "org-001",
        filters,
      );

      expect(mockPrisma.tour.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: "org-001",
          status: "DRAFT",
          priceBasis: "PER_PERSON",
          OR: [
            {
              title: {
                contains: "Cebu",
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: "Cebu",
                mode: "insensitive",
              },
            },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      });

      expect(result).toEqual(tours);
    });

    it("should support listing without optional filters", async () => {
      mockPrisma.tour.findMany.mockResolvedValue([]);

      await tourRepository.findMany("org-001", {
        skip: 0,
        take: 10,
      });

      expect(mockPrisma.tour.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: "org-001",
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("count", () => {
    it("should count tours using organization and filters", async () => {
      mockPrisma.tour.count.mockResolvedValue(5);

      const result = await tourRepository.count("org-001", {
        search: "Cebu",
        status: "DRAFT" as never,
        priceBasis: "PER_PERSON" as never,
      });

      expect(mockPrisma.tour.count).toHaveBeenCalledWith({
        where: {
          organizationId: "org-001",
          status: "DRAFT",
          priceBasis: "PER_PERSON",
          OR: [
            {
              title: {
                contains: "Cebu",
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: "Cebu",
                mode: "insensitive",
              },
            },
          ],
        },
      });

      expect(result).toBe(5);
    });
  });

  describe("create", () => {
    it("should create a tour", async () => {
      const data = {
        id: "tour-001",
        organizationId: "org-001",
        title: "Cebu South Tour",
      };

      mockPrisma.tour.create.mockResolvedValue(data);

      const result = await tourRepository.create(data as never);

      expect(mockPrisma.tour.create).toHaveBeenCalledWith({
        data,
      });
      expect(result).toEqual(data);
    });
  });

  describe("update", () => {
    it("should update a tour using its ID and organization ID", async () => {
      const data = { title: "Updated Cebu Tour" };
      const resultData = { id: "tour-001", ...data };

      mockPrisma.tour.updateMany.mockResolvedValue({ count: 1 });

      const result = await tourRepository.update(
        "tour-001",
        "org-001",
        data as never,
      );

      expect(mockPrisma.tour.updateMany).toHaveBeenCalledWith({
        where: {
          id: "tour-001",
          organizationId: "org-001",
        },
        data,
      });

      expect(result).toEqual({ count: 1 });
    });
  });

  describe("updateStatus", () => {
    it("should update a tour status", async () => {
      mockPrisma.tour.updateMany.mockResolvedValue({ count: 1 });

      const result = await tourRepository.updateStatus(
        "tour-001",
        "org-001",
        "PUBLISHED" as never,
      );

      expect(mockPrisma.tour.updateMany).toHaveBeenCalledWith({
        where: {
          id: "tour-001",
          organizationId: "org-001",
        },
        data: {
          status: "PUBLISHED",
        },
      });

      expect(result).toEqual({ count: 1 });
    });
  });

  describe("findPublicBySlug", () => {
    it("should find a published tour from an active organization", async () => {
      const tour = {
        id: "tour-001",
        slug: "cebu-south-tour",
        status: "PUBLISHED",
      };

      mockPrisma.tour.findFirst.mockResolvedValue(tour);

      const result = await tourRepository.findPublicBySlug(
        "cebu-south-tour",
      );

      expect(mockPrisma.tour.findFirst).toHaveBeenCalledWith({
        where: {
          slug: "cebu-south-tour",
          status: "PUBLISHED",
          Organization: {
            status: "ACTIVE",
          },
        },
        include: {
          ItineraryTemplate: {
            include: {
              ItineraryTemplateStop: {
                orderBy: [
                  { dayNumber: "asc" },
                  { sortOrder: "asc" },
                ],
              },
            },
          },
        },
      });

      expect(result).toEqual(tour);
    });
  });

  describe("findPublicMany", () => {
    it("should return published tours with pagination and search", async () => {
      const tours = [{ id: "tour-001" }];
      mockPrisma.tour.findMany.mockResolvedValue(tours);

      const result = await tourRepository.findPublicMany({
        skip: 0,
        take: 12,
        search: "Cebu",
      });

      expect(mockPrisma.tour.findMany).toHaveBeenCalledWith({
        where: {
          status: "PUBLISHED",
          Organization: {
            status: "ACTIVE",
          },
          title: {
            contains: "Cebu",
            mode: "insensitive",
          },
        },
        skip: 0,
        take: 12,
        orderBy: { createdAt: "desc" },
      });

      expect(result).toEqual(tours);
    });

    it("should support public listing without search", async () => {
      mockPrisma.tour.findMany.mockResolvedValue([]);

      await tourRepository.findPublicMany({
        skip: 0,
        take: 12,
      });

      expect(mockPrisma.tour.findMany).toHaveBeenCalledWith({
        where: {
          status: "PUBLISHED",
          Organization: {
            status: "ACTIVE",
          },
        },
        skip: 0,
        take: 12,
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("countPublic", () => {
    it("should count published tours with optional search", async () => {
      mockPrisma.tour.count.mockResolvedValue(3);

      const result = await tourRepository.countPublic("Cebu");

      expect(mockPrisma.tour.count).toHaveBeenCalledWith({
        where: {
          status: "PUBLISHED",
          Organization: {
            status: "ACTIVE",
          },
          title: {
            contains: "Cebu",
            mode: "insensitive",
          },
        },
      });

      expect(result).toBe(3);
    });

    it("should count published tours without search", async () => {
      mockPrisma.tour.count.mockResolvedValue(10);

      const result = await tourRepository.countPublic();

      expect(mockPrisma.tour.count).toHaveBeenCalledWith({
        where: {
          status: "PUBLISHED",
          Organization: {
            status: "ACTIVE",
          },
        },
      });

      expect(result).toBe(10);
    });
  });

  describe("findItineraryTemplate", () => {
    it("should find an itinerary template by ID and organization", async () => {
      const template = {
        id: "template-001",
        organizationId: "org-001",
      };

      mockPrisma.itineraryTemplate.findFirst.mockResolvedValue(template);

      const result = await tourRepository.findItineraryTemplate(
        "template-001",
        "org-001",
      );

      expect(mockPrisma.itineraryTemplate.findFirst).toHaveBeenCalledWith({
        where: {
          id: "template-001",
          organizationId: "org-001",
        },
      });

      expect(result).toEqual(template);
    });

    it("should return null when the template does not exist", async () => {
      mockPrisma.itineraryTemplate.findFirst.mockResolvedValue(null);

      const result = await tourRepository.findItineraryTemplate(
        "unknown-template",
        "org-001",
      );

      expect(result).toBeNull();
    });
  });
});
