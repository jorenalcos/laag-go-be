
import { randomUUID } from "crypto";
import { Prisma, InquiryStatus, ItineraryStatus, TourStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import type { CreateInquiryInput } from "./inquiry.validation";

type InquiryData = Pick<
  CreateInquiryInput,
  | "guestName"
  | "guestEmail"
  | "guestPhone"
  | "startDate"
  | "endDate"
  | "guestCount"
  | "pickupLocation"
  | "specialRequests"
  | "tourId"
>;

type GuestStopInput = NonNullable<
  NonNullable<CreateInquiryInput["itinerary"]>["stops"]
>[number];

type CreateGuestItineraryData = {
  templateId?: string | null;
  name: string;
  durationDays: number;
  notes?: string | null;
  stops: GuestStopInput[];
};

const inquiryInclude = {
  Tour: true,
  GuestItinerary: {
    include: {
      GuestItineraryStop: {
        orderBy: [
          { dayNumber: "asc" as const },
          { sortOrder: "asc" as const },
        ],
      },
    },
  },
};

export const inquiryRepository = {
  findPublishedTour(id: string) {
    return prisma.tour.findFirst({
      where: {
        id,
        status: TourStatus.PUBLISHED,
      },
    });
  },

  findPublishedTemplate(id: string) {
    return prisma.itineraryTemplate.findFirst({
      where: {
        id,
        status: ItineraryStatus.PUBLISHED,
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

  createWithItinerary(
    data: InquiryData,
    itinerary?: CreateGuestItineraryData
  ) {
    return prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.create({
        data: {
          id: randomUUID(),
          guestName: data.guestName,
          guestEmail: data.guestEmail.toLowerCase(),
          guestPhone: data.guestPhone ?? null,
          startDate: data.startDate ?? null,
          endDate: data.endDate ?? null,
          guestCount: data.guestCount,
          pickupLocation: data.pickupLocation ?? null,
          specialRequests: data.specialRequests ?? null,
          tourId: data.tourId ?? null,
          status: InquiryStatus.NEW,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (itinerary) {
        const guestItinerary = await tx.guestItinerary.create({
          data: {
            id: randomUUID(),
            inquiryId: inquiry.id,
            templateId: itinerary.templateId ?? null,
            name: itinerary.name,
            durationDays: itinerary.durationDays,
            notes: itinerary.notes ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        if (itinerary.stops.length > 0) {
          await tx.guestItineraryStop.createMany({
            data: itinerary.stops.map((stop) => ({
              id: randomUUID(),
              guestItineraryId: guestItinerary.id,
              dayNumber: stop.dayNumber,
              sortOrder: stop.sortOrder,
              name: stop.name,
              description: stop.description ?? null,
              location: stop.location ?? null,
              durationMinutes: stop.durationMinutes ?? null,
            })),
          });
        }
      }

      return tx.inquiry.findUniqueOrThrow({
        where: { id: inquiry.id },
        include: inquiryInclude,
      });
    });
  },

  findMany(
    filters: {
      skip: number;
      take: number;
      status?: InquiryStatus;
      search?: string;
    }
  ) {
    const where: Prisma.InquiryWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.search && {
        OR: [
          {
            guestName: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
          {
            guestEmail: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
          {
            guestPhone: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        ],
      }),
    };

    return prisma.inquiry.findMany({
      where,
      include: inquiryInclude,
      skip: filters.skip,
      take: filters.take,
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  count(filters: {
    status?: InquiryStatus;
    search?: string;
  }) {
    const where: Prisma.InquiryWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.search && {
        OR: [
          {
            guestName: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
          {
            guestEmail: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
          {
            guestPhone: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        ],
      }),
    };

    return prisma.inquiry.count({ where });
  },

  findById(id: string) {
    return prisma.inquiry.findUnique({
      where: { id },
      include: inquiryInclude,
    });
  },

  update(
    id: string,
    data: Prisma.InquiryUncheckedUpdateInput
  ) {
    return prisma.inquiry.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: inquiryInclude,
    });
  },
};
