
import { randomUUID } from "crypto";
import {
  Prisma,
  QuotationStatus,
} from "@prisma/client";

import { prisma } from "../../lib/prisma";

type QuotationItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

type CreateQuotationData = {
  inquiryId: string;
  currency: string;
  validUntil?: Date | null;
  terms?: string | null;
  items: QuotationItemInput[];
};

type UpdateQuotationData = {
  currency?: string;
  validUntil?: Date | null;
  terms?: string | null;
  items?: QuotationItemInput[];
};

const quotationInclude = {
  QuotationItem: true,
  Inquiry: true,
};

function calculateItems(items: QuotationItemInput[]) {
  return items.map((item) => {
    const quantity = new Prisma.Decimal(item.quantity);
    const unitPrice = new Prisma.Decimal(item.unitPrice);

    return {
      id: randomUUID(),
      description: item.description,
      quantity,
      unitPrice,
      lineTotal: quantity.mul(unitPrice),
    };
  });
}

export const quotationRepository = {
  findInquiry(id: string) {
    return prisma.inquiry.findUnique({
      where: { id },
    });
  },

  findById(id: string) {
    return prisma.quotation.findUnique({
      where: { id },
      include: quotationInclude,
    });
  },

  findMany(filters: {
    skip: number;
    take: number;
    status?: QuotationStatus;
    inquiryId?: string;
  }) {
    const where: Prisma.QuotationWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.inquiryId && {
        inquiryId: filters.inquiryId,
      }),
    };

    return prisma.quotation.findMany({
      where,
      include: quotationInclude,
      skip: filters.skip,
      take: filters.take,
      orderBy: [
        { createdAt: "desc" },
        { version: "desc" },
      ],
    });
  },

  count(filters: {
    status?: QuotationStatus;
    inquiryId?: string;
  }) {
    const where: Prisma.QuotationWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.inquiryId && {
        inquiryId: filters.inquiryId,
      }),
    };

    return prisma.quotation.count({ where });
  },

  async createDraft(data: CreateQuotationData) {
    return prisma.$transaction(async (tx) => {
      const latest = await tx.quotation.aggregate({
        where: {
          inquiryId: data.inquiryId,
        },
        _max: {
          version: true,
        },
      });

      const version = (latest._max.version ?? 0) + 1;

      const items = calculateItems(data.items);

      const sellingTotal = items.reduce(
        (total, item) => total.add(item.lineTotal),
        new Prisma.Decimal(0)
      );

      return tx.quotation.create({
        data: {
          id: randomUUID(),
          inquiryId: data.inquiryId,
          version,
          status: QuotationStatus.DRAFT,
          currency: data.currency,
          sellingTotal,
          validUntil: data.validUntil ?? null,
          terms: data.terms ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          QuotationItem: {
            create: items,
          },
        },
        include: quotationInclude,
      });
    });
  },

  async updateDraft(
    id: string,
    data: UpdateQuotationData
  ) {
    return prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
        },
      });

      if (!quotation) {
        throw new Error("Quotation not found");
      }

      if (quotation.status !== QuotationStatus.DRAFT) {
        throw new Error("Only draft quotations can be edited");
      }

      const updateData: Prisma.QuotationUncheckedUpdateInput = {
        ...(data.currency !== undefined && {
          currency: data.currency,
        }),
        ...(data.validUntil !== undefined && {
          validUntil: data.validUntil,
        }),
        ...(data.terms !== undefined && {
          terms: data.terms,
        }),
        updatedAt: new Date(),
      };

      if (data.items !== undefined) {
        const items = calculateItems(data.items);

        const sellingTotal = items.reduce(
          (total, item) => total.add(item.lineTotal),
          new Prisma.Decimal(0)
        );

        updateData.sellingTotal = sellingTotal;

        await tx.quotationItem.deleteMany({
          where: {
            quotationId: id,
          },
        });

        await tx.quotationItem.createMany({
          data: items.map((item) => ({
            ...item,
            quotationId: id,
          })),
        });
      }

      return tx.quotation.update({
        where: { id },
        data: updateData,
        include: quotationInclude,
      });
    });
  },

  updateStatus(
    id: string,
    status: QuotationStatus
  ) {
    const now = new Date();

    return prisma.quotation.update({
      where: { id },
      data: {
        status,
        ...(status === QuotationStatus.SENT && {
          sentAt: now,
        }),
        ...(status === QuotationStatus.ACCEPTED && {
          acceptedAt: now,
        }),
        updatedAt: now,
      },
      include: quotationInclude,
    });
  },
};
