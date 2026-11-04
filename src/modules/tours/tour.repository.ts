
import { Prisma, PriceBasis, TourStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export const tourRepository = {
  findOrganizationBySlug(slug: string) {
    return prisma.organization.findUnique({
      where: { slug },
    });
  },

  findBySlug(organizationId: string, slug: string) {
    return prisma.tour.findUnique({
      where: {
        organizationId_slug: {
          organizationId,
          slug,
        },
      },
    });
  },

  findById(id: string, organizationId: string) {
    return prisma.tour.findFirst({
      where: { id, organizationId },
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
  },

  findMany(
    organizationId: string,
    filters: {
      skip: number;
      take: number;
      search?: string;
      status?: TourStatus;
      priceBasis?: PriceBasis;
    }
  ) {
    return prisma.tour.findMany({
      where: {
        organizationId,
        ...(filters.status && { status: filters.status }),
        ...(filters.priceBasis && { priceBasis: filters.priceBasis }),
        ...(filters.search && {
          OR: [
            {
              title: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          ],
        }),
      },
      skip: filters.skip,
      take: filters.take,
      orderBy: { createdAt: "desc" },
    });
  },

  count(
    organizationId: string,
    filters: {
      search?: string;
      status?: TourStatus;
      priceBasis?: PriceBasis;
    }
  ) {
    return prisma.tour.count({
      where: {
        organizationId,
        ...(filters.status && { status: filters.status }),
        ...(filters.priceBasis && { priceBasis: filters.priceBasis }),
        ...(filters.search && {
          OR: [
            {
              title: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          ],
        }),
      },
    });
  },

  create(data: Prisma.TourUncheckedCreateInput) {
    return prisma.tour.create({ data });
  },

  update(
    id: string,
    organizationId: string,
    data: Prisma.TourUncheckedUpdateManyInput
  ) {
    return prisma.tour.updateMany({
      where: { id, organizationId },
      data,
    });
  },

  updateStatus(
    id: string,
    organizationId: string,
    status: TourStatus
  ) {
    return prisma.tour.updateMany({
      where: { id, organizationId },
      data: { status },
    });
  },

  findPublicBySlug(slug: string) {
    return prisma.tour.findFirst({
      where: {
        slug,
        status: TourStatus.PUBLISHED,
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
  },

  findPublicMany(filters: {
    skip: number;
    take: number;
    search?: string;
  }) {
    return prisma.tour.findMany({
      where: {
        status: TourStatus.PUBLISHED,
        Organization: {
          status: "ACTIVE",
        },
        ...(filters.search && {
          title: {
            contains: filters.search,
            mode: "insensitive",
          },
        }),
      },
      skip: filters.skip,
      take: filters.take,
      orderBy: { createdAt: "desc" },
    });
  },

  countPublic(search?: string) {
    return prisma.tour.count({
      where: {
        status: TourStatus.PUBLISHED,
        Organization: {
          status: "ACTIVE",
        },
        ...(search && {
          title: {
            contains: search,
            mode: "insensitive",
          },
        }),
      },
    });
  },

  findItineraryTemplate(id: string, organizationId: string) {
    return prisma.itineraryTemplate.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  },
};
