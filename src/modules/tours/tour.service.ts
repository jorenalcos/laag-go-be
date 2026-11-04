
import { PriceBasis, TourStatus, Prisma } from "@prisma/client";

import { tourRepository } from "./tour.repository";
import type {
  CreateTourInput,
  ListToursQuery,
  UpdateTourInput,
  PublicToursQuery,
} from "./tour.validation";
import { randomUUID } from "crypto";

const ORGANIZATION_SLUG =
  process.env.DEFAULT_ORGANIZATION_SLUG || "cj-cebu-adventures";

export class TourError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "TourError";
  }
}

function createSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getOrganization() {
  const organization =
    await tourRepository.findOrganizationBySlug(ORGANIZATION_SLUG);

  if (!organization || organization.status !== "ACTIVE") {
    throw new TourError(
      "The default LaagGo organization is unavailable or inactive",
      500
    );
  }

  return organization;
}

async function generateUniqueSlug(
  organizationId: string,
  title: string,
  excludeSlug?: string
) {
  const baseSlug = createSlug(title);

  if (!baseSlug) {
    throw new TourError("Unable to generate a valid tour slug", 400);
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await tourRepository.findBySlug(
      organizationId,
      slug
    );

    if (!existing || slug === excludeSlug) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

function validatePricing(
  priceBasis: PriceBasis,
  basePrice: number | null | undefined
) {
  if (priceBasis === PriceBasis.CUSTOM_QUOTE && basePrice != null) {
    throw new TourError(
      "Custom quote tours cannot have a fixed base price",
      400
    );
  }

  if (priceBasis !== PriceBasis.CUSTOM_QUOTE && basePrice == null) {
    throw new TourError(
      "A base price is required for this pricing basis",
      400
    );
  }
}

async function validateItinerary(
  templateId: string | null | undefined,
  organizationId: string
) {
  if (templateId === undefined || templateId === null) {
    return;
  }

  const template = await tourRepository.findItineraryTemplate(
    templateId,
    organizationId
  );

  if (!template) {
    throw new TourError(
      "The selected itinerary template does not exist",
      404
    );
  }
}

export const tourService = {
  async create(input: CreateTourInput) {
    const organization = await getOrganization();

    validatePricing(input.priceBasis, input.basePrice);

    await validateItinerary(
      input.defaultItineraryTemplateId,
      organization.id
    );

    const slug = await generateUniqueSlug(
      organization.id,
      input.title
    );

    return tourRepository.create({
      id: randomUUID(),
      organizationId: organization.id,
      title: input.title,
      slug,
      description: input.description ?? null,
      currency: input.currency.toUpperCase(),
      priceBasis: input.priceBasis,
      basePrice: input.basePrice ?? null,
      durationDays: input.durationDays,
      status: TourStatus.DRAFT,
      defaultItineraryTemplateId:
        input.defaultItineraryTemplateId ?? null,
      updatedAt: new Date(),
    });
  },

  async list(query: ListToursQuery) {
    const organization = await getOrganization();

    const filters = {
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      search: query.search,
      status: query.status,
      priceBasis: query.priceBasis,
    };

    const [items, total] = await Promise.all([
      tourRepository.findMany(organization.id, filters),
      tourRepository.count(organization.id, filters),
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

    const tour = await tourRepository.findById(
      id,
      organization.id
    );

    if (!tour) {
      throw new TourError("Tour not found", 404);
    }

    return tour;
  },

  async update(id: string, input: UpdateTourInput) {
    const organization = await getOrganization();

    const existing = await tourRepository.findById(
      id,
      organization.id
    );

    if (!existing) {
      throw new TourError("Tour not found", 404);
    }

    if (existing.status === TourStatus.ARCHIVED) {
      throw new TourError("Archived tours cannot be updated", 400);
    }

    const priceBasis = input.priceBasis ?? existing.priceBasis;
    const basePrice =
      input.basePrice !== undefined
        ? input.basePrice
        : existing.basePrice?.toNumber() ?? null;

    validatePricing(priceBasis, basePrice);

    await validateItinerary(
      input.defaultItineraryTemplateId,
      organization.id
    );

    const slug =
      input.title && input.title !== existing.title
        ? await generateUniqueSlug(
          organization.id,
          input.title,
          existing.slug
        )
        : existing.slug;

    const data: Prisma.TourUncheckedUpdateManyInput = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) {
      data.description = input.description;
    }
    if (input.currency !== undefined) {
      data.currency = input.currency.toUpperCase();
    }
    if (input.priceBasis !== undefined) {
      data.priceBasis = input.priceBasis;
    }
    if (input.basePrice !== undefined) {
      data.basePrice = input.basePrice;
    }
    if (input.durationDays !== undefined) {
      data.durationDays = input.durationDays;
    }
    if (input.defaultItineraryTemplateId !== undefined) {
      data.defaultItineraryTemplateId =
        input.defaultItineraryTemplateId;
    }

    if (input.title !== undefined) data.slug = slug;

    await tourRepository.update(id, organization.id, data);

    return this.getById(id);
  },

  async updateStatus(id: string, status: TourStatus) {
    const organization = await getOrganization();

    const existing = await tourRepository.findById(
      id,
      organization.id
    );

    if (!existing) {
      throw new TourError("Tour not found", 404);
    }

    if (existing.status === TourStatus.ARCHIVED) {
      throw new TourError("Archived tours cannot change status", 400);
    }

    await tourRepository.updateStatus(
      id,
      organization.id,
      status
    );

    return this.getById(id);
  },

  async archive(id: string) {
    return this.updateStatus(id, TourStatus.ARCHIVED);
  },

  async listPublic(query: PublicToursQuery) {
    const filters = {
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      search: query.search,
    };

    const [items, total] = await Promise.all([
      tourRepository.findPublicMany(filters),
      tourRepository.countPublic(query.search),
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

  async getPublicBySlug(slug: string) {
    const tour = await tourRepository.findPublicBySlug(slug);

    if (!tour) {
      throw new TourError("Published tour not found", 404);
    }

    return tour;
  },
};
