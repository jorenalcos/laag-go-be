
import { randomUUID } from "crypto";
import { ItineraryStatus, Prisma } from "@prisma/client";

import { itineraryRepository } from "./itinerary.repository";

import type {
  CreateItineraryInput,
  CreateItineraryStopInput,
  ListItinerariesQuery,
  UpdateItineraryInput,
  UpdateItineraryStopInput,
} from "./itinerary.validation";

const ORGANIZATION_SLUG =
  process.env.DEFAULT_ORGANIZATION_SLUG || "cj-cebu-adventures";

export class ItineraryError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ItineraryError";
  }
}

async function getOrganization() {
  const organization =
    await itineraryRepository.findOrganizationBySlug(
      ORGANIZATION_SLUG
    );

  if (!organization || organization.status !== "ACTIVE") {
    throw new ItineraryError(
      "The default LaagGo organization is unavailable or inactive",
      500
    );
  }

  return organization;
}

async function getItinerary(id: string, organizationId: string) {
  const itinerary = await itineraryRepository.findById(
    id,
    organizationId
  );

  if (!itinerary) {
    throw new ItineraryError("Itinerary not found", 404);
  }

  return itinerary;
}

function validateStopDays(
  stops: { dayNumber: number }[],
  durationDays: number
) {
  const invalidStop = stops.find(
    (stop) => stop.dayNumber > durationDays
  );

  if (invalidStop) {
    throw new ItineraryError(
      `Stop day cannot exceed itinerary duration of ${durationDays} days`,
      400
    );
  }
}

function normalizeStop(
  stop: CreateItineraryStopInput
) {
  return {
    dayNumber: stop.dayNumber,
    sortOrder: stop.sortOrder,
    name: stop.name,
    description: stop.description ?? null,
    location: stop.location ?? null,
    durationMinutes: stop.durationMinutes ?? null,
  };
}

export const itineraryService = {
  async create(input: CreateItineraryInput) {
    const organization = await getOrganization();

    validateStopDays(input.stops, input.durationDays);

    const stops = input.stops.map(normalizeStop);

    return itineraryRepository.create(
      {
        id: randomUUID(),
        organizationId: organization.id,
        name: input.name,
        description: input.description ?? null,
        durationDays: input.durationDays,
        status: ItineraryStatus.DRAFT,
        isFeatured: input.isFeatured,
      },
      stops
    );
  },

  async list(query: ListItinerariesQuery) {
    const organization = await getOrganization();

    const filters = {
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      search: query.search,
      status: query.status as ItineraryStatus | undefined,
      isFeatured:
        query.isFeatured === undefined
          ? undefined
          : query.isFeatured === "true",
    };

    const [items, total] = await Promise.all([
      itineraryRepository.findMany(organization.id, filters),
      itineraryRepository.count(organization.id, filters),
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
    const organization = await getOrganization();

    return getItinerary(id, organization.id);
  },

  async update(
    id: string,
    input: UpdateItineraryInput
  ) {
    const organization = await getOrganization();

    const existing = await getItinerary(
      id,
      organization.id
    );

    if (existing.status === ItineraryStatus.ARCHIVED) {
      throw new ItineraryError(
        "Archived itineraries cannot be updated",
        400
      );
    }

    const durationDays =
      input.durationDays ?? existing.durationDays;

    validateStopDays(
      existing.ItineraryTemplateStop,
      durationDays
    );

    const data: Prisma.ItineraryTemplateUncheckedUpdateManyInput = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.durationDays !== undefined) {
      data.durationDays = input.durationDays;
    }

    if (input.isFeatured !== undefined) {
      data.isFeatured = input.isFeatured;
    }

    await itineraryRepository.update(
      id,
      organization.id,
      data
    );

    return getItinerary(id, organization.id);
  },

  async updateStatus(
    id: string,
    status: ItineraryStatus
  ) {
    const organization = await getOrganization();

    const existing = await getItinerary(
      id,
      organization.id
    );

    if (existing.status === ItineraryStatus.ARCHIVED) {
      throw new ItineraryError(
        "Archived itineraries cannot change status",
        400
      );
    }

    if (
      status === ItineraryStatus.PUBLISHED &&
      existing.ItineraryTemplateStop.length === 0
    ) {
      throw new ItineraryError(
        "An itinerary must have at least one stop before publishing",
        400
      );
    }

    await itineraryRepository.updateStatus(
      id,
      organization.id,
      status
    );

    return getItinerary(id, organization.id);
  },

  async archive(id: string) {
    return this.updateStatus(id, ItineraryStatus.ARCHIVED);
  },

  async addStop(
    id: string,
    input: CreateItineraryStopInput
  ) {
    const organization = await getOrganization();

    const itinerary = await getItinerary(
      id,
      organization.id
    );

    if (itinerary.status === ItineraryStatus.ARCHIVED) {
      throw new ItineraryError(
        "Cannot add stops to an archived itinerary",
        400
      );
    }

    validateStopDays([input], itinerary.durationDays);

    await itineraryRepository.addStop(id, {
      ...normalizeStop(input),
    });

    return getItinerary(id, organization.id);
  },

  async updateStop(
    id: string,
    stopId: string,
    input: UpdateItineraryStopInput
  ) {
    const organization = await getOrganization();

    const itinerary = await getItinerary(
      id,
      organization.id
    );

    if (itinerary.status === ItineraryStatus.ARCHIVED) {
      throw new ItineraryError(
        "Cannot update stops in an archived itinerary",
        400
      );
    }

    const existingStop = await itineraryRepository.findStop(
      stopId,
      id
    );

    if (!existingStop) {
      throw new ItineraryError("Itinerary stop not found", 404);
    }

    const dayNumber =
      input.dayNumber ?? existingStop.dayNumber;

    validateStopDays(
      [{ dayNumber }],
      itinerary.durationDays
    );

    const data: Prisma.ItineraryTemplateStopUncheckedUpdateInput = {};

    if (input.dayNumber !== undefined) {
      data.dayNumber = input.dayNumber;
    }

    if (input.sortOrder !== undefined) {
      data.sortOrder = input.sortOrder;
    }

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.location !== undefined) {
      data.location = input.location;
    }

    if (input.durationMinutes !== undefined) {
      data.durationMinutes = input.durationMinutes;
    }

    await itineraryRepository.updateStop(
      stopId,
      id,
      data
    );

    return getItinerary(id, organization.id);
  },

  async deleteStop(id: string, stopId: string) {
    const organization = await getOrganization();

    const itinerary = await getItinerary(
      id,
      organization.id
    );

    if (itinerary.status === ItineraryStatus.ARCHIVED) {
      throw new ItineraryError(
        "Cannot delete stops from an archived itinerary",
        400
      );
    }

    const existingStop = await itineraryRepository.findStop(
      stopId,
      id
    );

    if (!existingStop) {
      throw new ItineraryError("Itinerary stop not found", 404);
    }

    await itineraryRepository.deleteStop(stopId, id);

    return getItinerary(id, organization.id);
  },
};
