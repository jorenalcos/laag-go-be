
import { Prisma, ItineraryStatus } from "@prisma/client";
import { randomUUID } from "crypto";

import { prisma } from "../../lib/prisma";

export const itineraryRepository = {
  findOrganizationBySlug(slug: string) {
    return prisma.organization.findUnique({
      where: { slug },
    });
  },

  findById(id: string, organizationId: string) {
    return prisma.itineraryTemplate.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        ItineraryTemplateStop: {
          orderBy: [
            { dayNumber: "asc" },
            { sortOrder: "asc" },
          ],
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
      status?: ItineraryStatus;
      isFeatured?: boolean;
    }
  ) {
    return prisma.itineraryTemplate.findMany({
      where: {
        organizationId,
        ...(filters.status && {
          status: filters.status,
        }),
        ...(filters.isFeatured !== undefined && {
          isFeatured: filters.isFeatured,
        }),
        ...(filters.search && {
          name: {
            contains: filters.search,
            mode: "insensitive",
          },
        }),
      },
      include: {
        ItineraryTemplateStop: {
          orderBy: [
            { dayNumber: "asc" },
            { sortOrder: "asc" },
          ],
        },
      },
      skip: filters.skip,
      take: filters.take,
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  count(
    organizationId: string,
    filters: {
      search?: string;
      status?: ItineraryStatus;
      isFeatured?: boolean;
    }
  ) {
    return prisma.itineraryTemplate.count({
      where: {
        organizationId,
        ...(filters.status && {
          status: filters.status,
        }),
        ...(filters.isFeatured !== undefined && {
          isFeatured: filters.isFeatured,
        }),
        ...(filters.search && {
          name: {
            contains: filters.search,
            mode: "insensitive",
          },
        }),
      },
    });
  },

  create(
    data: Omit<
      Prisma.ItineraryTemplateUncheckedCreateInput,
      "createdAt" | "updatedAt"
    >,
    stops: Omit<
      Prisma.ItineraryTemplateStopCreateManyInput,
      "templateId" | "id"
    >[]
  ) {
    return prisma.$transaction(async (tx) => {
      const template = await tx.itineraryTemplate.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (stops.length > 0) {
        await tx.itineraryTemplateStop.createMany({
          data: stops.map((stop) => ({
            ...stop,
            id: randomUUID(),
            templateId: template.id,
          })),
        });
      }

      return tx.itineraryTemplate.findUniqueOrThrow({
        where: { id: template.id },
        include: {
          ItineraryTemplateStop: {
            orderBy: [
              { dayNumber: "asc" },
              { sortOrder: "asc" },
            ],
          },
        },
      });
    });
  },

  update(
    id: string,
    organizationId: string,
    data: Prisma.ItineraryTemplateUncheckedUpdateManyInput
  ) {
    return prisma.itineraryTemplate.updateMany({
      where: {
        id,
        organizationId,
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },

  updateStatus(
    id: string,
    organizationId: string,
    status: ItineraryStatus
  ) {
    return prisma.itineraryTemplate.updateMany({
      where: {
        id,
        organizationId,
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  },

  addStop(
    templateId: string,
    data: Omit<
      Prisma.ItineraryTemplateStopUncheckedCreateInput,
      "templateId" | "id"
    >
  ) {
    return prisma.itineraryTemplateStop.create({
      data: {
        ...data,
        id: randomUUID(),
        templateId,
      },
    });
  },

  findStop(id: string, templateId: string) {
    return prisma.itineraryTemplateStop.findFirst({
      where: {
        id,
        templateId,
      },
    });
  },

  updateStop(
    id: string,
    templateId: string,
    data: Prisma.ItineraryTemplateStopUncheckedUpdateInput
  ) {
    return prisma.itineraryTemplateStop.updateMany({
      where: {
        id,
        templateId,
      },
      data,
    });
  },

  deleteStop(id: string, templateId: string) {
    return prisma.itineraryTemplateStop.deleteMany({
      where: {
        id,
        templateId,
      },
    });
  },

  async replaceStops(
    templateId: string,
    stops: Omit<
      Prisma.ItineraryTemplateStopCreateManyInput,
      "templateId" | "id"
    >[]
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.itineraryTemplateStop.deleteMany({
        where: { templateId },
      });

      if (stops.length > 0) {
        await tx.itineraryTemplateStop.createMany({
          data: stops.map((stop) => ({
            ...stop,
            id: randomUUID(),
            templateId,
          })),
        });
      }

      return tx.itineraryTemplate.findUniqueOrThrow({
        where: { id: templateId },
        include: {
          ItineraryTemplateStop: {
            orderBy: [
              { dayNumber: "asc" },
              { sortOrder: "asc" },
            ],
          },
        },
      });
    });
  },
};
