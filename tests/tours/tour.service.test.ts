
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PriceBasis, TourStatus } from "@prisma/client";

const mockRepository = vi.hoisted(() => ({
  findOrganizationBySlug: vi.fn(),
  findBySlug: vi.fn(),
  findById: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  findPublicMany: vi.fn(),
  countPublic: vi.fn(),
  findPublicBySlug: vi.fn(),
  findItineraryTemplate: vi.fn(),
}));

vi.mock("../../src/modules/tours/tour.repository", () => ({
  tourRepository: mockRepository,
}));

import { tourService, TourError } from "../../src/modules/tours/tour.service";

const organization = {
  id: "org-001",
  slug: "cj-cebu-adventures",
  status: "ACTIVE",
};

const tour = {
  id: "tour-001",
  organizationId: "org-001",
  title: "Cebu South Tour",
  slug: "cebu-south-tour",
  description: "Explore Cebu South",
  currency: "PHP",
  priceBasis: PriceBasis.PER_PERSON,
  basePrice: {
    toNumber: () => 2500,
  },
  durationDays: 2,
  status: TourStatus.DRAFT,
  defaultItineraryTemplateId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Tour Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository.findOrganizationBySlug.mockResolvedValue(organization);
    mockRepository.findBySlug.mockResolvedValue(null);
    mockRepository.findById.mockResolvedValue(tour);
    mockRepository.findMany.mockResolvedValue([tour]);
    mockRepository.count.mockResolvedValue(1);
    mockRepository.create.mockResolvedValue(tour);
    mockRepository.update.mockResolvedValue(tour);
    mockRepository.updateStatus.mockResolvedValue(tour);
    mockRepository.findPublicMany.mockResolvedValue([tour]);
    mockRepository.countPublic.mockResolvedValue(1);
    mockRepository.findPublicBySlug.mockResolvedValue(tour);
    mockRepository.findItineraryTemplate.mockResolvedValue({ id: "template-001" });
  });

  describe("create", () => {
    const validInput = {
      title: "Cebu South Tour",
      description: "Explore Cebu South",
      currency: "PHP",
      priceBasis: PriceBasis.PER_PERSON,
      basePrice: 2500,
      durationDays: 2,
    };

    it("should create a tour successfully", async () => {
      const result = await tourService.create(validInput);

      expect(result).toEqual(tour);
      expect(mockRepository.findOrganizationBySlug).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: organization.id,
          title: validInput.title,
          slug: "cebu-south-tour",
          status: TourStatus.DRAFT,
        }),
      );
    });

    it("should reject when organization does not exist", async () => {
      mockRepository.findOrganizationBySlug.mockResolvedValue(null);

      await expect(tourService.create(validInput)).rejects.toThrow(
        "The default LaagGo organization is unavailable or inactive",
      );
    });

    it("should reject when organization is inactive", async () => {
      mockRepository.findOrganizationBySlug.mockResolvedValue({
        ...organization,
        status: "INACTIVE",
      });

      await expect(tourService.create(validInput)).rejects.toThrow(TourError);
    });

    it("should reject custom quote with a fixed base price", async () => {
      await expect(
        tourService.create({
          ...validInput,
          priceBasis: PriceBasis.CUSTOM_QUOTE,
          basePrice: 2500,
        }),
      ).rejects.toThrow("Custom quote tours cannot have a fixed base price");
    });

    it("should reject fixed pricing without a base price", async () => {
      await expect(
        tourService.create({
          ...validInput,
          basePrice: null,
        }),
      ).rejects.toThrow("A base price is required for this pricing basis");
    });

    it("should reject an invalid itinerary template", async () => {
      mockRepository.findItineraryTemplate.mockResolvedValue(null);

      await expect(
        tourService.create({
          ...validInput,
          defaultItineraryTemplateId: "invalid-template",
        }),
      ).rejects.toThrow("The selected itinerary template does not exist");
    });

    it("should generate a unique slug when the slug already exists", async () => {
      mockRepository.findBySlug.mockResolvedValueOnce(tour);

      await tourService.create(validInput);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: "cebu-south-tour-2",
        }),
      );
    });
  });

  describe("list", () => {
    it("should return tours with pagination", async () => {
      const result = await tourService.list({
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        items: [tour],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it("should pass filters to the repository", async () => {
      await tourService.list({
        page: 2,
        limit: 5,
        search: "Cebu",
        status: TourStatus.DRAFT,
        priceBasis: PriceBasis.PER_PERSON,
      });

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        organization.id,
        expect.objectContaining({
          skip: 5,
          take: 5,
          search: "Cebu",
          status: TourStatus.DRAFT,
          priceBasis: PriceBasis.PER_PERSON,
        }),
      );
    });

    it("should calculate total pages correctly", async () => {
      mockRepository.count.mockResolvedValue(25);

      const result = await tourService.list({
        page: 1,
        limit: 10,
      });

      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe("getById", () => {
    it("should return a tour by ID", async () => {
      const result = await tourService.getById("tour-001");

      expect(result).toEqual(tour);
      expect(mockRepository.findById).toHaveBeenCalledWith(
        "tour-001",
        organization.id,
      );
    });

    it("should throw when the tour does not exist", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(tourService.getById("missing-id")).rejects.toThrow(
        "Tour not found",
      );
    });
  });

  describe("update", () => {
    it("should update a tour successfully", async () => {
      const updatedTour = {
        ...tour,
        title: "Updated Cebu Tour",
      };

      mockRepository.findById
        .mockResolvedValueOnce(tour)
        .mockResolvedValueOnce(updatedTour);

      mockRepository.update.mockResolvedValue(updatedTour);

      const result = await tourService.update("tour-001", {
        title: "Updated Cebu Tour",
      });

      expect(result).toMatchObject({
        id: "tour-001",
        title: "Updated Cebu Tour",
      });

      expect(mockRepository.update).toHaveBeenCalledWith(
        "tour-001",
        organization.id,
        expect.objectContaining({
          title: "Updated Cebu Tour",
        }),
      );
    });

    it("should reject when the tour does not exist", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        tourService.update("missing-id", { title: "Updated Tour" }),
      ).rejects.toThrow("Tour not found");
    });

    it("should reject updates to archived tours", async () => {
      mockRepository.findById.mockResolvedValue({
        ...tour,
        status: TourStatus.ARCHIVED,
      });

      await expect(
        tourService.update("tour-001", { title: "Updated Tour" }),
      ).rejects.toThrow("Archived tours cannot be updated");
    });

    it("should reject an invalid pricing combination", async () => {
      await expect(
        tourService.update("tour-001", {
          priceBasis: PriceBasis.CUSTOM_QUOTE,
          basePrice: 2500,
        }),
      ).rejects.toThrow("Custom quote tours cannot have a fixed base price");
    });

    it("should validate an updated itinerary template", async () => {
      mockRepository.findItineraryTemplate.mockResolvedValue(null);

      await expect(
        tourService.update("tour-001", {
          defaultItineraryTemplateId: "invalid-template",
        }),
      ).rejects.toThrow("The selected itinerary template does not exist");
    });

    it("should regenerate the slug when the title changes", async () => {
      mockRepository.findBySlug.mockResolvedValue(null);

      await tourService.update("tour-001", {
        title: "New Cebu Adventure",
      });

      expect(mockRepository.update).toHaveBeenCalledWith(
        "tour-001",
        organization.id,
        expect.objectContaining({
          slug: "new-cebu-adventure",
        }),
      );
    });
  });

  describe("updateStatus", () => {
    it("should update the tour status", async () => {
      const publishedTour = {
        ...tour,
        status: TourStatus.PUBLISHED,
      };

      mockRepository.findById
        .mockResolvedValueOnce(tour)
        .mockResolvedValueOnce(publishedTour);

      mockRepository.updateStatus.mockResolvedValue(publishedTour);

      const result = await tourService.updateStatus(
        "tour-001",
        TourStatus.PUBLISHED,
      );

      expect(result.status).toBe(TourStatus.PUBLISHED);

      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        "tour-001",
        organization.id,
        TourStatus.PUBLISHED,
      );
    });

    it("should reject when the tour does not exist", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        tourService.updateStatus("missing-id", TourStatus.PUBLISHED),
      ).rejects.toThrow("Tour not found");
    });

    it("should reject status changes for archived tours", async () => {
      mockRepository.findById.mockResolvedValue({
        ...tour,
        status: TourStatus.ARCHIVED,
      });

      await expect(
        tourService.updateStatus("tour-001", TourStatus.PUBLISHED),
      ).rejects.toThrow("Archived tours cannot change status");
    });
  });

  describe("archive", () => {
    it("should archive a tour", async () => {
      const archivedTour = {
        ...tour,
        status: TourStatus.ARCHIVED,
      };

      mockRepository.findById
        .mockResolvedValueOnce(tour)
        .mockResolvedValueOnce(archivedTour);

      mockRepository.updateStatus.mockResolvedValue(archivedTour);

      const result = await tourService.archive("tour-001");

      expect(result.status).toBe(TourStatus.ARCHIVED);

      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        "tour-001",
        organization.id,
        TourStatus.ARCHIVED,
      );
    });
  });

  describe("listPublic", () => {
    it("should return public tours with pagination", async () => {
      const result = await tourService.listPublic({
        page: 1,
        limit: 12,
      });

      expect(result).toEqual({
        items: [tour],
        pagination: {
          page: 1,
          limit: 12,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it("should pass search and pagination filters", async () => {
      await tourService.listPublic({
        page: 2,
        limit: 6,
        search: "Cebu",
      });

      expect(mockRepository.findPublicMany).toHaveBeenCalledWith({
        skip: 6,
        take: 6,
        search: "Cebu",
      });
    });
  });

  describe("getPublicBySlug", () => {
    it("should return a published tour by slug", async () => {
      const result = await tourService.getPublicBySlug("cebu-south-tour");

      expect(result).toEqual(tour);
      expect(mockRepository.findPublicBySlug).toHaveBeenCalledWith(
        "cebu-south-tour",
      );
    });

    it("should reject when the published tour does not exist", async () => {
      mockRepository.findPublicBySlug.mockResolvedValue(null);

      await expect(
        tourService.getPublicBySlug("missing-tour"),
      ).rejects.toThrow("Published tour not found");
    });
  });
});
