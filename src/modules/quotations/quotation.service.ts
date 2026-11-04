
import { QuotationStatus } from "@prisma/client";

import { quotationRepository } from "./quotation.repository";

import type {
  CreateQuotationInput,
  UpdateQuotationInput,
  ChangeQuotationStatusInput,
  ListQuotationsQuery,
} from "./quotation.validation";

export class QuotationError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "QuotationError";
  }
}

const allowedTransitions: Record<
  QuotationStatus,
  QuotationStatus[]
> = {
  DRAFT: [
    QuotationStatus.SENT,
    QuotationStatus.CANCELLED,
  ],
  SENT: [
    QuotationStatus.ACCEPTED,
    QuotationStatus.REJECTED,
    QuotationStatus.EXPIRED,
    QuotationStatus.CANCELLED,
  ],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
  CANCELLED: [],
};

export const quotationService = {
  async create(input: CreateQuotationInput) {
    const inquiry = await quotationRepository.findInquiry(
      input.inquiryId
    );

    if (!inquiry) {
      throw new QuotationError("Inquiry not found", 404);
    }

    if (
      input.validUntil &&
      input.validUntil.getTime() <= Date.now()
    ) {
      throw new QuotationError(
        "Quotation validity date must be in the future",
        400
      );
    }

    return quotationRepository.createDraft({
      inquiryId: input.inquiryId,
      currency: input.currency,
      validUntil: input.validUntil,
      terms: input.terms,
      items: input.items,
    });
  },

  async list(query: ListQuotationsQuery) {
    const filters = {
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      status: query.status,
      inquiryId: query.inquiryId,
    };

    const [items, total] = await Promise.all([
      quotationRepository.findMany(filters),
      quotationRepository.count({
        status: filters.status,
        inquiryId: filters.inquiryId,
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
    const quotation = await quotationRepository.findById(id);

    if (!quotation) {
      throw new QuotationError("Quotation not found", 404);
    }

    return quotation;
  },

  async update(
    id: string,
    input: UpdateQuotationInput
  ) {
    const quotation = await quotationRepository.findById(id);

    if (!quotation) {
      throw new QuotationError("Quotation not found", 404);
    }

    if (quotation.status !== QuotationStatus.DRAFT) {
      throw new QuotationError(
        "Only draft quotations can be edited",
        400
      );
    }

    if (
      input.validUntil &&
      input.validUntil.getTime() <= Date.now()
    ) {
      throw new QuotationError(
        "Quotation validity date must be in the future",
        400
      );
    }

    return quotationRepository.updateDraft(id, {
      currency: input.currency,
      validUntil: input.validUntil,
      terms: input.terms,
      items: input.items,
    });
  },

  async changeStatus(
    id: string,
    input: ChangeQuotationStatusInput
  ) {
    const quotation = await quotationRepository.findById(id);

    if (!quotation) {
      throw new QuotationError("Quotation not found", 404);
    }

    const nextStatus = input.status as QuotationStatus;

    if (!allowedTransitions[quotation.status].includes(nextStatus)) {
      throw new QuotationError(
        `Cannot change quotation status from ${quotation.status} to ${nextStatus}`,
        400
      );
    }

    if (
      nextStatus === QuotationStatus.ACCEPTED &&
      quotation.validUntil &&
      quotation.validUntil.getTime() <= Date.now()
    ) {
      throw new QuotationError(
        "This quotation has expired and cannot be accepted",
        400
      );
    }

    if (
      nextStatus === QuotationStatus.EXPIRED &&
      (!quotation.validUntil ||
        quotation.validUntil.getTime() > Date.now())
    ) {
      throw new QuotationError(
        "A quotation can only be marked expired after its validity date",
        400
      );
    }

    return quotationRepository.updateStatus(id, nextStatus);
  },
};
