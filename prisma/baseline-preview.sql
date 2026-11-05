-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CommissionMethod" AS ENUM ('PERCENTAGE', 'FIXED_PER_BOOKING', 'NET_RATE');

-- CreateEnum
CREATE TYPE "public"."CommissionStatus" AS ENUM ('DUE', 'PAID', 'REVERSED');

-- CreateEnum
CREATE TYPE "public"."InquiryStatus" AS ENUM ('NEW', 'REVIEWING', 'PROVIDER_ASSIGNED', 'QUOTED', 'ACCEPTED', 'LOST', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ItineraryStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."MemberRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "public"."OrganizationStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."OrganizationType" AS ENUM ('TOUR_OPERATOR', 'ACCOMMODATION_PROVIDER', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."PriceBasis" AS ENUM ('PER_PERSON', 'PER_GROUP', 'CUSTOM_QUOTE');

-- CreateEnum
CREATE TYPE "public"."ProviderQuoteStatus" AS ENUM ('REQUESTED', 'RECEIVED', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TourStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "agreedTotal" DECIMAL(12,2) NOT NULL,
    "providerCost" DECIMAL(12,2) NOT NULL,
    "commissionMethod" "public"."CommissionMethod",
    "commissionRate" DECIMAL(8,4),
    "commissionAmount" DECIMAL(12,2),
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommissionAgreement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "method" "public"."CommissionMethod" NOT NULL,
    "rate" DECIMAL(8,4),
    "fixedAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommissionLedgerEntry" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "status" "public"."CommissionStatus" NOT NULL DEFAULT 'DUE',
    "description" TEXT,
    "paidAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GuestItinerary" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "templateId" TEXT,
    "name" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestItinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GuestItineraryStop" (
    "id" TEXT NOT NULL,
    "guestItineraryId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "durationMinutes" INTEGER,

    CONSTRAINT "GuestItineraryStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Inquiry" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "assignedOrganizationId" TEXT,
    "assignedUserId" TEXT,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "guestCount" INTEGER NOT NULL DEFAULT 1,
    "pickupLocation" TEXT,
    "specialRequests" TEXT,
    "internalNotes" TEXT,
    "status" "public"."InquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tourId" TEXT,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItineraryTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."ItineraryStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItineraryTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItineraryTemplateStop" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "durationMinutes" INTEGER,

    CONSTRAINT "ItineraryTemplateStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "public"."OrganizationType" NOT NULL,
    "status" "public"."OrganizationStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrganizationMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "public"."MemberRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderQuote" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "public"."ProviderQuoteStatus" NOT NULL DEFAULT 'REQUESTED',
    "providerCost" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Quotation" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "public"."QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "sellingTotal" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "validUntil" TIMESTAMP(3),
    "terms" TEXT,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tour" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "priceBasis" "public"."PriceBasis" NOT NULL DEFAULT 'CUSTOM_QUOTE',
    "basePrice" DECIMAL(12,2),
    "durationDays" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."TourStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "defaultItineraryTemplateId" TEXT,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_inquiryId_key" ON "public"."Booking"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_quotationId_key" ON "public"."Booking"("quotationId");

-- CreateIndex
CREATE INDEX "Booking_organizationId_status_idx" ON "public"."Booking"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Booking_status_createdAt_idx" ON "public"."Booking"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CommissionAgreement_organizationId_isActive_effectiveFrom_idx" ON "public"."CommissionAgreement"("organizationId", "isActive", "effectiveFrom");

-- CreateIndex
CREATE INDEX "CommissionLedgerEntry_bookingId_status_idx" ON "public"."CommissionLedgerEntry"("bookingId", "status");

-- CreateIndex
CREATE INDEX "CommissionLedgerEntry_organizationId_status_idx" ON "public"."CommissionLedgerEntry"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GuestItinerary_inquiryId_key" ON "public"."GuestItinerary"("inquiryId");

-- CreateIndex
CREATE INDEX "GuestItineraryStop_guestItineraryId_dayNumber_sortOrder_idx" ON "public"."GuestItineraryStop"("guestItineraryId", "dayNumber", "sortOrder");

-- CreateIndex
CREATE INDEX "Inquiry_assignedOrganizationId_status_idx" ON "public"."Inquiry"("assignedOrganizationId", "status");

-- CreateIndex
CREATE INDEX "Inquiry_guestEmail_idx" ON "public"."Inquiry"("guestEmail");

-- CreateIndex
CREATE INDEX "Inquiry_status_createdAt_idx" ON "public"."Inquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Inquiry_tourId_idx" ON "public"."Inquiry"("tourId");

-- CreateIndex
CREATE INDEX "ItineraryTemplate_organizationId_idx" ON "public"."ItineraryTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "ItineraryTemplate_status_isFeatured_idx" ON "public"."ItineraryTemplate"("status", "isFeatured");

-- CreateIndex
CREATE INDEX "ItineraryTemplateStop_templateId_dayNumber_sortOrder_idx" ON "public"."ItineraryTemplateStop"("templateId", "dayNumber", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "public"."Organization"("slug");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_role_idx" ON "public"."OrganizationMember"("organizationId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_userId_organizationId_key" ON "public"."OrganizationMember"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "ProviderQuote_inquiryId_status_idx" ON "public"."ProviderQuote"("inquiryId", "status");

-- CreateIndex
CREATE INDEX "ProviderQuote_organizationId_status_idx" ON "public"."ProviderQuote"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Quotation_status_validUntil_idx" ON "public"."Quotation"("status", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_inquiryId_version_key" ON "public"."Quotation"("inquiryId", "version");

-- CreateIndex
CREATE INDEX "QuotationItem_quotationId_idx" ON "public"."QuotationItem"("quotationId");

-- CreateIndex
CREATE INDEX "Tour_defaultItineraryTemplateId_idx" ON "public"."Tour"("defaultItineraryTemplateId");

-- CreateIndex
CREATE INDEX "Tour_status_title_idx" ON "public"."Tour"("status", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Tour_organizationId_slug_key" ON "public"."Tour"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "public"."Inquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "public"."Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionAgreement" ADD CONSTRAINT "CommissionAgreement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionLedgerEntry" ADD CONSTRAINT "CommissionLedgerEntry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionLedgerEntry" ADD CONSTRAINT "CommissionLedgerEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GuestItinerary" ADD CONSTRAINT "GuestItinerary_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "public"."Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GuestItinerary" ADD CONSTRAINT "GuestItinerary_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ItineraryTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GuestItineraryStop" ADD CONSTRAINT "GuestItineraryStop_guestItineraryId_fkey" FOREIGN KEY ("guestItineraryId") REFERENCES "public"."GuestItinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inquiry" ADD CONSTRAINT "Inquiry_assignedOrganizationId_fkey" FOREIGN KEY ("assignedOrganizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inquiry" ADD CONSTRAINT "Inquiry_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inquiry" ADD CONSTRAINT "Inquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inquiry" ADD CONSTRAINT "Inquiry_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "public"."Tour"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItineraryTemplate" ADD CONSTRAINT "ItineraryTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItineraryTemplateStop" ADD CONSTRAINT "ItineraryTemplateStop_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ItineraryTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderQuote" ADD CONSTRAINT "ProviderQuote_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "public"."Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderQuote" ADD CONSTRAINT "ProviderQuote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "public"."Inquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "public"."Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tour" ADD CONSTRAINT "Tour_defaultItineraryTemplateId_fkey" FOREIGN KEY ("defaultItineraryTemplateId") REFERENCES "public"."ItineraryTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tour" ADD CONSTRAINT "Tour_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
