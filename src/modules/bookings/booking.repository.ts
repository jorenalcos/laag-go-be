import { randomUUID } from "crypto";
import {
  BookingStatus,
  Prisma,
  QuotationStatus,
} from "@prisma/client";

import { prisma } from "../../lib/prisma";

const DEFAULT_ORGANIZATION_SLUG = "cj-cebu-adventures";

const bookingInclude = {
  Inquiry: true,
  Quotation: {
    include: {
      QuotationItem: true,
    },
  },
  Organization: true,
};

type CreateBookingData = {
  quotationId: string;
  providerCost: number;
  internalNotes?: string | null;
};

type UpdateBookingData = {
  internalNotes?: string | null;
};

export const bookingRepository = {
  async create(data: CreateBookingData) {
    return prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({
        where: { id: data.quotationId },
        include: {
          Inquiry: true,
        },
      });

      if (!quotation) {
        throw new Error("QUOTATION_NOT_FOUND");
      }

      if (quotation.status !== QuotationStatus.ACCEPTED) {
        throw new Error("QUOTATION_NOT_ACCEPTED");
      }

      const existingBooking = await tx.booking.findFirst({
        where: {
          OR: [
            { quotationId: quotation.id },
            { inquiryId: quotation.inquiryId },
          ],
        },
      });

      if (existingBooking) {
        throw new Error("BOOKING_ALREADY_EXISTS");
      }

      const organization = await tx.organization.findUnique({
        where: {
          slug: DEFAULT_ORGANIZATION_SLUG,
        },
      });

      if (!organization) {
        throw new Error("ORGANIZATION_NOT_FOUND");
      }

      return tx.booking.create({
        data: {
          id: randomUUID(),
          inquiryId: quotation.inquiryId,
          quotationId: quotation.id,
          organizationId: organization.id,
          status: BookingStatus.PENDING_CONFIRMATION,
          currency: quotation.currency,
          agreedTotal: quotation.sellingTotal,
          providerCost: new Prisma.Decimal(data.providerCost),
          internalNotes: data.internalNotes ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: bookingInclude,
      });
    });
  },

  findById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
  },

  findMany(filters: {
    skip: number;
    take: number;
    status?: BookingStatus;
    inquiryId?: string;
    quotationId?: string;
  }) {
    const where: Prisma.BookingWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.inquiryId && { inquiryId: filters.inquiryId }),
      ...(filters.quotationId && { quotationId: filters.quotationId }),
    };

    return prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: {
        createdAt: "desc",
      },
      skip: filters.skip,
      take: filters.take,
    });
  },

  count(filters: {
    status?: BookingStatus;
    inquiryId?: string;
    quotationId?: string;
  }) {
    const where: Prisma.BookingWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.inquiryId && { inquiryId: filters.inquiryId }),
      ...(filters.quotationId && { quotationId: filters.quotationId }),
    };

    return prisma.booking.count({ where });
  },

  update(id: string, data: UpdateBookingData) {
    return prisma.booking.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: bookingInclude,
    });
  },

  updateStatus(
    id: string,
    status: BookingStatus,
    timestamps: {
      confirmedAt?: Date | null;
      completedAt?: Date | null;
      cancelledAt?: Date | null;
    },
  ) {
    return prisma.booking.update({
      where: { id },
      data: {
        status,
        ...timestamps,
        updatedAt: new Date(),
      },
      include: bookingInclude,
    });
  },
};