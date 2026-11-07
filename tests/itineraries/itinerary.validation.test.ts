
import { describe, expect, it } from "vitest";

import {
  createItinerarySchema,
  updateItinerarySchema,
  createItineraryStopSchema,
  updateItineraryStopSchema,
  updateItineraryStatusSchema,
  itineraryParamsSchema,
  itineraryStopParamsSchema,
  listItinerariesQuerySchema,
} from "../../src/modules/itineraries/itinerary.validation";

describe("Itinerary Validation", () => {
  describe("createItinerarySchema", () => {
    const validInput = {
      name: "South Cebu Adventure",
      description: "Explore the southern part of Cebu",
      durationDays: 3,
      isFeatured: true,
      stops: [
        {
          dayNumber: 1,
          sortOrder: 0,
          name: "Kawasan Falls",
          location: "Badian, Cebu",
          durationMinutes: 120,
        },
      ],
    };

    it("should accept valid itinerary data", () => {
      expect(createItinerarySchema.safeParse(validInput).success).toBe(true);
    });

    it("should reject a missing itinerary name", () => {
      const { name, ...input } = validInput;

      expect(createItinerarySchema.safeParse(input).success).toBe(false);
    });

    it("should reject an empty itinerary name", () => {
      expect(
        createItinerarySchema.safeParse({
          ...validInput,
          name: " ",
        }).success,
      ).toBe(false);
    });

    it("should reject a name longer than 160 characters", () => {
      expect(
        createItinerarySchema.safeParse({
          ...validInput,
          name: "A".repeat(161),
        }).success,
      ).toBe(false);
    });

    it("should default durationDays to 1", () => {
      const { durationDays, ...input } = validInput;

      const result = createItinerarySchema.safeParse(input);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.durationDays).toBe(1);
      }
    });

    it("should reject durationDays greater than 365", () => {
      expect(
        createItinerarySchema.safeParse({
          ...validInput,
          durationDays: 366,
        }).success,
      ).toBe(false);
    });

    it("should reject an empty stops array", () => {
      expect(
        createItinerarySchema.safeParse({
          ...validInput,
          stops: [],
        }).success,
      ).toBe(false);
    });

    it("should reject a stop beyond itinerary duration", () => {
      expect(
        createItinerarySchema.safeParse({
          ...validInput,
          durationDays: 2,
          stops: [{ ...validInput.stops[0], dayNumber: 3 }],
        }).success,
      ).toBe(false);
    });

    it("should reject unknown properties", () => {
      expect(
        createItinerarySchema.safeParse({
          ...validInput,
          unknownField: "unexpected",
        }).success,
      ).toBe(false);
    });
  });

  describe("updateItinerarySchema", () => {
    it("should accept a partial update", () => {
      expect(
        updateItinerarySchema.safeParse({
          name: "Updated Cebu Tour",
        }).success,
      ).toBe(true);
    });

    it("should reject an empty update object", () => {
      expect(updateItinerarySchema.safeParse({}).success).toBe(false);
    });

    it("should reject an invalid duration", () => {
      expect(
        updateItinerarySchema.safeParse({
          durationDays: 0,
        }).success,
      ).toBe(false);
    });

    it("should reject unknown properties", () => {
      expect(
        updateItinerarySchema.safeParse({
          name: "Updated Tour",
          invalidField: true,
        }).success,
      ).toBe(false);
    });
  });

  describe("createItineraryStopSchema", () => {
    it("should accept valid stop data", () => {
      expect(
        createItineraryStopSchema.safeParse({
          dayNumber: 1,
          sortOrder: 0,
          name: "Kawasan Falls",
          location: "Badian, Cebu",
          durationMinutes: 120,
        }).success,
      ).toBe(true);
    });

    it("should default dayNumber to 1", () => {
      const result = createItineraryStopSchema.safeParse({
        name: "Kawasan Falls",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.dayNumber).toBe(1);
      }
    });

    it("should reject a day number below 1", () => {
      expect(
        createItineraryStopSchema.safeParse({
          name: "Kawasan Falls",
          dayNumber: 0,
        }).success,
      ).toBe(false);
    });

    it("should reject an empty stop name", () => {
      expect(
        createItineraryStopSchema.safeParse({
          name: " ",
        }).success,
      ).toBe(false);
    });

    it("should reject a negative duration", () => {
      expect(
        createItineraryStopSchema.safeParse({
          name: "Kawasan Falls",
          durationMinutes: -10,
        }).success,
      ).toBe(false);
    });

    it("should accept nullable optional description", () => {
      expect(
        createItineraryStopSchema.safeParse({
          name: "Kawasan Falls",
          description: null,
        }).success,
      ).toBe(true);
    });
  });

  describe("updateItineraryStopSchema", () => {
    it("should accept a partial stop update", () => {
      expect(
        updateItineraryStopSchema.safeParse({
          name: "Updated Stop",
        }).success,
      ).toBe(true);
    });

    it("should reject an empty update", () => {
      const result = updateItineraryStopSchema.safeParse({});

      console.log("Empty update validation:", result);

      expect(result.success).toBe(false);
    });

    it("should reject an invalid day number", () => {
      expect(
        updateItineraryStopSchema.safeParse({
          dayNumber: 0,
        }).success,
      ).toBe(false);
    });
  });

  describe("updateItineraryStatusSchema", () => {
    it.each(["DRAFT", "PUBLISHED", "ARCHIVED"])(
      "should accept status %s",
      (status) => {
        expect(
          updateItineraryStatusSchema.safeParse({ status }).success,
        ).toBe(true);
      },
    );

    it("should reject an unsupported status", () => {
      expect(
        updateItineraryStatusSchema.safeParse({
          status: "DELETED",
        }).success,
      ).toBe(false);
    });
  });

  describe("itineraryParamsSchema", () => {
    it("should accept a valid itinerary ID", () => {
      expect(
        itineraryParamsSchema.safeParse({
          id: "itinerary-001",
        }).success,
      ).toBe(true);
    });

    it("should reject an empty itinerary ID", () => {
      expect(
        itineraryParamsSchema.safeParse({
          id: "",
        }).success,
      ).toBe(false);
    });
  });

  describe("itineraryStopParamsSchema", () => {
    it("should accept valid itinerary and stop IDs", () => {
      expect(
        itineraryStopParamsSchema.safeParse({
          id: "itinerary-001",
          stopId: "stop-001",
        }).success,
      ).toBe(true);
    });

    it("should reject a missing stop ID", () => {
      expect(
        itineraryStopParamsSchema.safeParse({
          id: "itinerary-001",
        }).success,
      ).toBe(false);
    });
  });

  describe("listItinerariesQuerySchema", () => {
    it("should apply pagination defaults", () => {
      const result = listItinerariesQuerySchema.safeParse({});

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should coerce pagination query strings into numbers", () => {
      const result = listItinerariesQuerySchema.safeParse({
        page: "2",
        limit: "50",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it("should reject a limit greater than 100", () => {
      expect(
        listItinerariesQuerySchema.safeParse({
          limit: "101",
        }).success,
      ).toBe(false);
    });

    it("should reject an invalid status", () => {
      expect(
        listItinerariesQuerySchema.safeParse({
          status: "DELETED",
        }).success,
      ).toBe(false);
    });

    it("should accept true and false featured filters", () => {
      expect(
        listItinerariesQuerySchema.safeParse({
          isFeatured: "true",
        }).success,
      ).toBe(true);

      expect(
        listItinerariesQuerySchema.safeParse({
          isFeatured: "false",
        }).success,
      ).toBe(true);
    });
  });
});
