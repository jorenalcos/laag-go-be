
import { InquiryStatus } from "@prisma/client";

import { inquiryRepository } from "./inquiry.repository";

import type {
  CreateInquiryInput,
  ListInquiriesQuery,
  UpdateInquiryInput,
} from "./inquiry.validation";

export class InquiryError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "InquiryError";
  }
}

export const inquiryService = {
  async create(input: CreateInquiryInput) {
    // Validate the selected tour, if provided.
    if (input.tourId) {
      const tour = await inquiryRepository.findPublishedTour(
        input.tourId
      );

      if (!tour) {
        throw new InquiryError(
          "Selected tour was not found or is not published",
          404
        );
      }
    }

    let guestItinerary:
      | {
          templateId?: string | null;
          name: string;
          durationDays: number;
          notes?: string | null;
          stops: {
            dayNumber: number;
            sortOrder: number;
            name: string;
            description?: string | null;
            location?: string | null;
            durationMinutes?: number | null;
          }[];
        }
      | undefined;

    const requestedItinerary = input.itinerary;

    if (requestedItinerary) {
      let stops: {
        dayNumber: number;
        sortOrder: number;
        name: string;
        description?: string | null;
        location?: string | null;
        durationMinutes?: number | null;
      }[] = [];

      if (
        requestedItinerary.type === "TEMPLATE" ||
        requestedItinerary.type === "MIXED"
      ) {
        if (!requestedItinerary.templateId) {
          throw new InquiryError(
            "An itinerary template is required",
            400
          );
        }

        const template =
          await inquiryRepository.findPublishedTemplate(
            requestedItinerary.templateId
          );

        if (!template) {
          throw new InquiryError(
            "Selected itinerary template was not found or is not published",
            404
          );
        }

        if (
          template.ItineraryTemplateStop.some(
            (stop) =>
              stop.dayNumber > requestedItinerary.durationDays
          )
        ) {
          throw new InquiryError(
            "Itinerary duration is shorter than one or more template stops",
            400
          );
        }

        if (requestedItinerary.type === "TEMPLATE") {
          stops = template.ItineraryTemplateStop.map((stop) => ({
            dayNumber: stop.dayNumber,
            sortOrder: stop.sortOrder,
            name: stop.name,
            description: stop.description,
            location: stop.location,
            durationMinutes: stop.durationMinutes,
          }));
        } else {
          // MIXED requests contain the complete customized stop list.
          stops = (requestedItinerary.stops ?? []).map((stop) => ({
            dayNumber: stop.dayNumber,
            sortOrder: stop.sortOrder,
            name: stop.name,
            description: stop.description ?? null,
            location: stop.location ?? null,
            durationMinutes: stop.durationMinutes ?? null,
          }));
        }
      }

      if (requestedItinerary.type === "CUSTOM") {
        stops = (requestedItinerary.stops ?? []).map((stop) => ({
          dayNumber: stop.dayNumber,
          sortOrder: stop.sortOrder,
          name: stop.name,
          description: stop.description ?? null,
          location: stop.location ?? null,
          durationMinutes: stop.durationMinutes ?? null,
        }));
      }

      if (
        stops.some(
          (stop) => stop.dayNumber > requestedItinerary.durationDays
        )
      ) {
        throw new InquiryError(
          "A destination day cannot exceed the itinerary duration",
          400
        );
      }

      guestItinerary = {
        templateId: requestedItinerary.templateId ?? null,
        name: requestedItinerary.name,
        durationDays: requestedItinerary.durationDays,
        notes: requestedItinerary.notes ?? null,
        stops,
      };
    }

    return inquiryRepository.createWithItinerary(
      {
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        startDate: input.startDate,
        endDate: input.endDate,
        guestCount: input.guestCount,
        pickupLocation: input.pickupLocation,
        specialRequests: input.specialRequests,
        tourId: input.tourId,
      },
      guestItinerary
    );
  },

  async list(query: ListInquiriesQuery) {
    const filters = {
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      status: query.status as InquiryStatus | undefined,
      search: query.search,
    };

    const [items, total] = await Promise.all([
      inquiryRepository.findMany(filters),
      inquiryRepository.count({
        status: filters.status,
        search: filters.search,
      }),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getById(id: string) {
    const inquiry = await inquiryRepository.findById(id);

    if (!inquiry) {
      throw new InquiryError("Inquiry not found", 404);
    }

    return inquiry;
  },

  async update(
    id: string,
    input: UpdateInquiryInput
  ) {
    const existing = await inquiryRepository.findById(id);

    if (!existing) {
      throw new InquiryError("Inquiry not found", 404);
    }

    if (input.status === InquiryStatus.NEW) {
      throw new InquiryError(
        "An inquiry cannot be moved back to NEW",
        400
      );
    }

    return inquiryRepository.update(id, {
      ...(input.status !== undefined && {
        status: input.status,
      }),
      ...(input.assignedOrganizationId !== undefined && {
        assignedOrganizationId: input.assignedOrganizationId,
      }),
      ...(input.internalNotes !== undefined && {
        internalNotes: input.internalNotes,
      }),
    });
  },
};
