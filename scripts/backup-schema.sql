--
-- PostgreSQL database dump
--

\restrict lLQ1f7Cu0yBzS7iZh4JRIHVsecnhFWJpnsTcgDp8J2iAdVJgxmoWpzPLLyyL1Lb

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'PENDING_CONFIRMATION',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: CommissionMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CommissionMethod" AS ENUM (
    'PERCENTAGE',
    'FIXED_PER_BOOKING',
    'NET_RATE'
);


--
-- Name: CommissionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CommissionStatus" AS ENUM (
    'DUE',
    'PAID',
    'REVERSED'
);


--
-- Name: InquiryStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InquiryStatus" AS ENUM (
    'NEW',
    'REVIEWING',
    'PROVIDER_ASSIGNED',
    'QUOTED',
    'ACCEPTED',
    'LOST',
    'CANCELLED'
);


--
-- Name: ItineraryStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ItineraryStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


--
-- Name: MemberRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MemberRole" AS ENUM (
    'OWNER',
    'ADMIN',
    'STAFF'
);


--
-- Name: OrganizationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrganizationStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED'
);


--
-- Name: OrganizationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrganizationType" AS ENUM (
    'TOUR_OPERATOR',
    'ACCOMMODATION_PROVIDER',
    'BOTH'
);


--
-- Name: PriceBasis; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PriceBasis" AS ENUM (
    'PER_PERSON',
    'PER_GROUP',
    'CUSTOM_QUOTE'
);


--
-- Name: ProviderQuoteStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ProviderQuoteStatus" AS ENUM (
    'REQUESTED',
    'RECEIVED',
    'ACCEPTED',
    'DECLINED',
    'EXPIRED'
);


--
-- Name: QuotationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuotationStatus" AS ENUM (
    'DRAFT',
    'SENT',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED',
    'CANCELLED'
);


--
-- Name: TourStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TourStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Booking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Booking" (
    id text NOT NULL,
    "inquiryId" text NOT NULL,
    "quotationId" text NOT NULL,
    "organizationId" text NOT NULL,
    status public."BookingStatus" DEFAULT 'PENDING_CONFIRMATION'::public."BookingStatus" NOT NULL,
    currency text DEFAULT 'PHP'::text NOT NULL,
    "agreedTotal" numeric(12,2) NOT NULL,
    "providerCost" numeric(12,2) NOT NULL,
    "commissionMethod" public."CommissionMethod",
    "commissionRate" numeric(8,4),
    "commissionAmount" numeric(12,2),
    "confirmedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "cancelledAt" timestamp(3) without time zone,
    "internalNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CommissionAgreement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommissionAgreement" (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    method public."CommissionMethod" NOT NULL,
    rate numeric(8,4),
    "fixedAmount" numeric(12,2),
    currency text DEFAULT 'PHP'::text NOT NULL,
    "effectiveFrom" timestamp(3) without time zone NOT NULL,
    "effectiveTo" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CommissionLedgerEntry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommissionLedgerEntry" (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "organizationId" text NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'PHP'::text NOT NULL,
    status public."CommissionStatus" DEFAULT 'DUE'::public."CommissionStatus" NOT NULL,
    description text,
    "paidAt" timestamp(3) without time zone,
    "reversedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GuestItinerary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GuestItinerary" (
    id text NOT NULL,
    "inquiryId" text NOT NULL,
    "templateId" text,
    name text NOT NULL,
    "durationDays" integer DEFAULT 1 NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GuestItineraryStop; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GuestItineraryStop" (
    id text NOT NULL,
    "guestItineraryId" text NOT NULL,
    "dayNumber" integer DEFAULT 1 NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    name text NOT NULL,
    description text,
    location text,
    "durationMinutes" integer
);


--
-- Name: Inquiry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Inquiry" (
    id text NOT NULL,
    "customerId" text,
    "assignedOrganizationId" text,
    "assignedUserId" text,
    "guestName" text NOT NULL,
    "guestEmail" text NOT NULL,
    "guestPhone" text,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "guestCount" integer DEFAULT 1 NOT NULL,
    "pickupLocation" text,
    "specialRequests" text,
    "internalNotes" text,
    status public."InquiryStatus" DEFAULT 'NEW'::public."InquiryStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tourId" text
);


--
-- Name: ItineraryTemplate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ItineraryTemplate" (
    id text NOT NULL,
    "organizationId" text,
    name text NOT NULL,
    description text,
    "durationDays" integer DEFAULT 1 NOT NULL,
    status public."ItineraryStatus" DEFAULT 'DRAFT'::public."ItineraryStatus" NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ItineraryTemplateStop; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ItineraryTemplateStop" (
    id text NOT NULL,
    "templateId" text NOT NULL,
    "dayNumber" integer DEFAULT 1 NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    name text NOT NULL,
    description text,
    location text,
    "durationMinutes" integer
);


--
-- Name: Organization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Organization" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    type public."OrganizationType" NOT NULL,
    status public."OrganizationStatus" DEFAULT 'PENDING'::public."OrganizationStatus" NOT NULL,
    description text,
    email text,
    phone text,
    address text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OrganizationMember; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrganizationMember" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "organizationId" text NOT NULL,
    role public."MemberRole" DEFAULT 'STAFF'::public."MemberRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ProviderQuote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProviderQuote" (
    id text NOT NULL,
    "inquiryId" text NOT NULL,
    "organizationId" text NOT NULL,
    status public."ProviderQuoteStatus" DEFAULT 'REQUESTED'::public."ProviderQuoteStatus" NOT NULL,
    "providerCost" numeric(12,2),
    currency text DEFAULT 'PHP'::text NOT NULL,
    "validUntil" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Quotation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Quotation" (
    id text NOT NULL,
    "inquiryId" text NOT NULL,
    version integer NOT NULL,
    status public."QuotationStatus" DEFAULT 'DRAFT'::public."QuotationStatus" NOT NULL,
    "sellingTotal" numeric(12,2) NOT NULL,
    currency text DEFAULT 'PHP'::text NOT NULL,
    "validUntil" timestamp(3) without time zone,
    terms text,
    "sentAt" timestamp(3) without time zone,
    "acceptedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: QuotationItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QuotationItem" (
    id text NOT NULL,
    "quotationId" text NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    "unitPrice" numeric(12,2) NOT NULL,
    "lineTotal" numeric(12,2) NOT NULL
);


--
-- Name: Tour; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tour" (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    currency text DEFAULT 'PHP'::text NOT NULL,
    "priceBasis" public."PriceBasis" DEFAULT 'CUSTOM_QUOTE'::public."PriceBasis" NOT NULL,
    "basePrice" numeric(12,2),
    "durationDays" integer DEFAULT 1 NOT NULL,
    status public."TourStatus" DEFAULT 'DRAFT'::public."TourStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "defaultItineraryTemplateId" text
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    phone text,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: Booking Booking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_pkey" PRIMARY KEY (id);


--
-- Name: CommissionAgreement CommissionAgreement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommissionAgreement"
    ADD CONSTRAINT "CommissionAgreement_pkey" PRIMARY KEY (id);


--
-- Name: CommissionLedgerEntry CommissionLedgerEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommissionLedgerEntry"
    ADD CONSTRAINT "CommissionLedgerEntry_pkey" PRIMARY KEY (id);


--
-- Name: GuestItineraryStop GuestItineraryStop_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GuestItineraryStop"
    ADD CONSTRAINT "GuestItineraryStop_pkey" PRIMARY KEY (id);


--
-- Name: GuestItinerary GuestItinerary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GuestItinerary"
    ADD CONSTRAINT "GuestItinerary_pkey" PRIMARY KEY (id);


--
-- Name: Inquiry Inquiry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Inquiry"
    ADD CONSTRAINT "Inquiry_pkey" PRIMARY KEY (id);


--
-- Name: ItineraryTemplateStop ItineraryTemplateStop_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ItineraryTemplateStop"
    ADD CONSTRAINT "ItineraryTemplateStop_pkey" PRIMARY KEY (id);


--
-- Name: ItineraryTemplate ItineraryTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ItineraryTemplate"
    ADD CONSTRAINT "ItineraryTemplate_pkey" PRIMARY KEY (id);


--
-- Name: OrganizationMember OrganizationMember_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY (id);


--
-- Name: Organization Organization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY (id);


--
-- Name: ProviderQuote ProviderQuote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProviderQuote"
    ADD CONSTRAINT "ProviderQuote_pkey" PRIMARY KEY (id);


--
-- Name: QuotationItem QuotationItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_pkey" PRIMARY KEY (id);


--
-- Name: Quotation Quotation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_pkey" PRIMARY KEY (id);


--
-- Name: Tour Tour_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tour"
    ADD CONSTRAINT "Tour_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Booking_inquiryId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Booking_inquiryId_key" ON public."Booking" USING btree ("inquiryId");


--
-- Name: Booking_organizationId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Booking_organizationId_status_idx" ON public."Booking" USING btree ("organizationId", status);


--
-- Name: Booking_quotationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Booking_quotationId_key" ON public."Booking" USING btree ("quotationId");


--
-- Name: Booking_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Booking_status_createdAt_idx" ON public."Booking" USING btree (status, "createdAt");


--
-- Name: CommissionAgreement_organizationId_isActive_effectiveFrom_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CommissionAgreement_organizationId_isActive_effectiveFrom_idx" ON public."CommissionAgreement" USING btree ("organizationId", "isActive", "effectiveFrom");


--
-- Name: CommissionLedgerEntry_bookingId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CommissionLedgerEntry_bookingId_status_idx" ON public."CommissionLedgerEntry" USING btree ("bookingId", status);


--
-- Name: CommissionLedgerEntry_organizationId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CommissionLedgerEntry_organizationId_status_idx" ON public."CommissionLedgerEntry" USING btree ("organizationId", status);


--
-- Name: GuestItineraryStop_guestItineraryId_dayNumber_sortOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GuestItineraryStop_guestItineraryId_dayNumber_sortOrder_idx" ON public."GuestItineraryStop" USING btree ("guestItineraryId", "dayNumber", "sortOrder");


--
-- Name: GuestItinerary_inquiryId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "GuestItinerary_inquiryId_key" ON public."GuestItinerary" USING btree ("inquiryId");


--
-- Name: Inquiry_assignedOrganizationId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Inquiry_assignedOrganizationId_status_idx" ON public."Inquiry" USING btree ("assignedOrganizationId", status);


--
-- Name: Inquiry_guestEmail_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Inquiry_guestEmail_idx" ON public."Inquiry" USING btree ("guestEmail");


--
-- Name: Inquiry_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Inquiry_status_createdAt_idx" ON public."Inquiry" USING btree (status, "createdAt");


--
-- Name: Inquiry_tourId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Inquiry_tourId_idx" ON public."Inquiry" USING btree ("tourId");


--
-- Name: ItineraryTemplateStop_templateId_dayNumber_sortOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ItineraryTemplateStop_templateId_dayNumber_sortOrder_idx" ON public."ItineraryTemplateStop" USING btree ("templateId", "dayNumber", "sortOrder");


--
-- Name: ItineraryTemplate_organizationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ItineraryTemplate_organizationId_idx" ON public."ItineraryTemplate" USING btree ("organizationId");


--
-- Name: ItineraryTemplate_status_isFeatured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ItineraryTemplate_status_isFeatured_idx" ON public."ItineraryTemplate" USING btree (status, "isFeatured");


--
-- Name: OrganizationMember_organizationId_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrganizationMember_organizationId_role_idx" ON public."OrganizationMember" USING btree ("organizationId", role);


--
-- Name: OrganizationMember_userId_organizationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "OrganizationMember_userId_organizationId_key" ON public."OrganizationMember" USING btree ("userId", "organizationId");


--
-- Name: Organization_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Organization_slug_key" ON public."Organization" USING btree (slug);


--
-- Name: ProviderQuote_inquiryId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProviderQuote_inquiryId_status_idx" ON public."ProviderQuote" USING btree ("inquiryId", status);


--
-- Name: ProviderQuote_organizationId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProviderQuote_organizationId_status_idx" ON public."ProviderQuote" USING btree ("organizationId", status);


--
-- Name: QuotationItem_quotationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QuotationItem_quotationId_idx" ON public."QuotationItem" USING btree ("quotationId");


--
-- Name: Quotation_inquiryId_version_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Quotation_inquiryId_version_key" ON public."Quotation" USING btree ("inquiryId", version);


--
-- Name: Quotation_status_validUntil_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Quotation_status_validUntil_idx" ON public."Quotation" USING btree (status, "validUntil");


--
-- Name: Tour_defaultItineraryTemplateId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Tour_defaultItineraryTemplateId_idx" ON public."Tour" USING btree ("defaultItineraryTemplateId");


--
-- Name: Tour_organizationId_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Tour_organizationId_slug_key" ON public."Tour" USING btree ("organizationId", slug);


--
-- Name: Tour_status_title_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Tour_status_title_idx" ON public."Tour" USING btree (status, title);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Booking Booking_inquiryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES public."Inquiry"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Booking Booking_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Booking Booking_quotationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES public."Quotation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CommissionAgreement CommissionAgreement_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommissionAgreement"
    ADD CONSTRAINT "CommissionAgreement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CommissionLedgerEntry CommissionLedgerEntry_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommissionLedgerEntry"
    ADD CONSTRAINT "CommissionLedgerEntry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CommissionLedgerEntry CommissionLedgerEntry_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommissionLedgerEntry"
    ADD CONSTRAINT "CommissionLedgerEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GuestItineraryStop GuestItineraryStop_guestItineraryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GuestItineraryStop"
    ADD CONSTRAINT "GuestItineraryStop_guestItineraryId_fkey" FOREIGN KEY ("guestItineraryId") REFERENCES public."GuestItinerary"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GuestItinerary GuestItinerary_inquiryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GuestItinerary"
    ADD CONSTRAINT "GuestItinerary_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES public."Inquiry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GuestItinerary GuestItinerary_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GuestItinerary"
    ADD CONSTRAINT "GuestItinerary_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."ItineraryTemplate"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Inquiry Inquiry_assignedOrganizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Inquiry"
    ADD CONSTRAINT "Inquiry_assignedOrganizationId_fkey" FOREIGN KEY ("assignedOrganizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Inquiry Inquiry_assignedUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Inquiry"
    ADD CONSTRAINT "Inquiry_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Inquiry Inquiry_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Inquiry"
    ADD CONSTRAINT "Inquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Inquiry Inquiry_tourId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Inquiry"
    ADD CONSTRAINT "Inquiry_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES public."Tour"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ItineraryTemplateStop ItineraryTemplateStop_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ItineraryTemplateStop"
    ADD CONSTRAINT "ItineraryTemplateStop_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."ItineraryTemplate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ItineraryTemplate ItineraryTemplate_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ItineraryTemplate"
    ADD CONSTRAINT "ItineraryTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrganizationMember OrganizationMember_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrganizationMember OrganizationMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProviderQuote ProviderQuote_inquiryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProviderQuote"
    ADD CONSTRAINT "ProviderQuote_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES public."Inquiry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProviderQuote ProviderQuote_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProviderQuote"
    ADD CONSTRAINT "ProviderQuote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuotationItem QuotationItem_quotationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES public."Quotation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Quotation Quotation_inquiryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES public."Inquiry"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Tour Tour_defaultItineraryTemplateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tour"
    ADD CONSTRAINT "Tour_defaultItineraryTemplateId_fkey" FOREIGN KEY ("defaultItineraryTemplateId") REFERENCES public."ItineraryTemplate"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Tour Tour_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tour"
    ADD CONSTRAINT "Tour_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict lLQ1f7Cu0yBzS7iZh4JRIHVsecnhFWJpnsTcgDp8J2iAdVJgxmoWpzPLLyyL1Lb

