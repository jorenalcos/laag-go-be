import {
  BookingStatus,
} from "@prisma/client";

import { prisma } from "../../lib/prisma";

export const dashboardRepository = {
  async getSummary() {
    const [
      inquiryCounts,
      quotationCounts,
      bookingCounts,
      revenue,
      recentInquiries,
      recentQuotations,
      recentBookings,
    ] = await Promise.all([
      // Inquiry counts grouped by status.
      prisma.inquiry.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),

      // Quotation counts grouped by status.
      prisma.quotation.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),

      // Booking counts grouped by status.
      prisma.booking.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),

      // Revenue from confirmed and completed bookings.
      prisma.booking.aggregate({
        where: {
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.COMPLETED,
            ],
          },
        },
        _sum: {
          agreedTotal: true,
        },
        _count: {
          _all: true,
        },
      }),

      // Latest five inquiries.
      prisma.inquiry.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          guestName: true,
          guestEmail: true,
          status: true,
          startDate: true,
          guestCount: true,
          createdAt: true,
          Tour: {
            select: {
              title: true,
            },
          },
        },
      }),

      // Latest five quotations.
      prisma.quotation.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          Inquiry: {
            select: {
              guestName: true,
              guestEmail: true,
            },
          },
        },
      }),

      // Latest five bookings.
      prisma.booking.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          Inquiry: {
            select: {
              guestName: true,
              guestEmail: true,
            },
          },
          Quotation: {
            select: {
              version: true,
              sellingTotal: true,
              currency: true,
            },
          },
        },
      }),
    ]);

    return {
      inquiryCounts,
      quotationCounts,
      bookingCounts,
      revenue,
      recentInquiries,
      recentQuotations,
      recentBookings,
    };
  },
};