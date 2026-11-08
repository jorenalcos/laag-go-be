
import { describe, expect, it } from "vitest";

import {
  mediaFolderSchema,
  uploadMediaSchema,
} from "../../src/modules/media/media.validation";

describe("mediaFolderSchema", () => {
  it.each([
    "products",
    "categories",
    "tours",
    "itineraries",
    "organizations",
    "profiles",
  ])("should accept %s as a valid folder", (folder) => {
    expect(mediaFolderSchema.safeParse(folder).success).toBe(true);
  });

  it.each([
    "invalid",
    "users",
    "documents",
    "",
    123,
    null,
  ])("should reject %s as an invalid folder", (folder) => {
    expect(mediaFolderSchema.safeParse(folder).success).toBe(false);
  });
});

describe("uploadMediaSchema", () => {
  it("should default to tours when no folder is provided", () => {
    const result = uploadMediaSchema.safeParse({});

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.folder).toBe("tours");
    }
  });

  it("should accept a valid folder", () => {
    const result = uploadMediaSchema.safeParse({
      folder: "products",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.folder).toBe("products");
    }
  });

  it("should reject an invalid folder", () => {
    expect(
      uploadMediaSchema.safeParse({
        folder: "invalid",
      }).success,
    ).toBe(false);
  });

  it("should reject null input", () => {
    expect(uploadMediaSchema.safeParse(null).success).toBe(false);
  });
});
