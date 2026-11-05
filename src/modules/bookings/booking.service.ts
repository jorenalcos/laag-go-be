import { BookingStatus } from "@prisma/client";

import { bookingRepository } from "./booking.repository";

import type {
  CreateBookingInput,
  UpdateBookingInput,
  ChangeBookingStatusInput,
  ListBookingsQuery,
} from "./booking.validation";

export class BookingError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "BookingError";
  }
}

const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  PENDING_CONFIRMATION: [
    BookingStatus.CONFIRMED,
    BookingStatus.CANCELLED,
  ],
  CONFIRMED: [
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export const bookingService = {
  async create(input: CreateBookingInput) {
    try {
      return await bookingRepository.create(input);
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "QUOTATION_NOT_FOUND":
            throw new BookingError("Quotation not found", 404);

          case "QUOTATION_NOT_ACCEPTED":
            throw new BookingError(
              "Only accepted quotations can be converted into bookings",
              400,
            );

          case "BOOKING_ALREADY_EXISTS":
            throw new BookingError(
              "A booking already exists for this inquiry or quotation",
              409,
            );

          case "ORGANIZATION_NOT_FOUND":
            throw new BookingError(
              "Default organization was not found",
              500,
            );
        }
      }

      throw error;
    }
  },

  async list(query: ListBookingsQuery) {
    const filters = {
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      status: query.status,
      inquiryId: query.inquiryId,
      quotationId: query.quotationId,
    };

    const [bookings, total] = await Promise.all([
      bookingRepository.findMany(filters),
      bookingRepository.count({
        status: query.status,
        inquiryId: query.inquiryId,
        quotationId: query.quotationId,
      }),
    ]);

    return {
      bookings,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getById(id: string) {
    const booking = await bookingRepository.findById(id);

    if (!booking) {
      throw new BookingError("Booking not found", 404);
    }

    return booking;
  },

  async update(id: string, input: UpdateBookingInput) {
    const booking = await bookingRepository.findById(id);

    if (!booking) {
      throw new BookingError("Booking not found", 404);
    }

    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED
    ) {
      throw new BookingError(
        "Completed or cancelled bookings cannot be updated",
        400,
      );
    }

    return bookingRepository.update(id, input);
  },

  async changeStatus(
    id: string,
    input: ChangeBookingStatusInput,
  ) {
    const booking = await bookingRepository.findById(id);

    if (!booking) {
      throw new BookingError("Booking not found", 404);
    }

    const nextStatus = input.status;

    if (!allowedTransitions[booking.status].includes(nextStatus)) {
      throw new BookingError(
        `Cannot change booking status from ${booking.status} to ${nextStatus}`,
        400,
      );
    }

    const now = new Date();

    const timestamps = {
      ...(nextStatus === BookingStatus.CONFIRMED && {
        confirmedAt: now,
      }),
      ...(nextStatus === BookingStatus.COMPLETED && {
        completedAt: now,
      }),
      ...(nextStatus === BookingStatus.CANCELLED && {
        cancelledAt: now,
      }),
    };

    return bookingRepository.updateStatus(
      id,
      nextStatus,
      timestamps,
    );
  },
};