import {
  InquiryStatus,
  QuotationStatus,
  BookingStatus,
} from "@prisma/client";

import { dashboardRepository } from "./dashboard.repository";

function formatStatusCounts<T extends string>(
  statuses: readonly T[],
  records: { status: T; _count: { _all: number } }[],
) {
  const counts = Object.fromEntries(
    statuses.map((status) => [status, 0]),
  ) as Record<T, number>;

  for (const record of records) {
    counts[record.status] = record._count._all;
  }

  return {
    total: (Object.values(counts) as number[]).reduce(
      (sum, count) => sum + count,
      0,
    ),
    byStatus: counts,
  };
}

export const dashboardService = {
  async getSummary() {
    const data = await dashboardRepository.getSummary();

    const inquiries = formatStatusCounts(
      Object.values(InquiryStatus),
      data.inquiryCounts,
    );

    const quotations = formatStatusCounts(
      Object.values(QuotationStatus),
      data.quotationCounts,
    );

    const bookings = formatStatusCounts(
      Object.values(BookingStatus),
      data.bookingCounts,
    );

    return {
      overview: {
        inquiries,
        quotations,
        bookings,
      },

      revenue: {
        total: data.revenue._sum.agreedTotal?.toString() ?? "0.00",
        currency: "PHP",
        bookingCount: data.revenue._count._all,
      },

      recentActivity: {
        inquiries: data.recentInquiries,
        quotations: data.recentQuotations,
        bookings: data.recentBookings,
      },

      generatedAt: new Date().toISOString(),
    };
  },
};