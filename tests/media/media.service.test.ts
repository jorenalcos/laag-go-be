
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Writable } from "node:stream";

const { uploadStreamMock, destroyMock } = vi.hoisted(() => ({
  uploadStreamMock: vi.fn(),
  destroyMock: vi.fn(),
}));

vi.mock("../../src/lib/cloudinary", () => ({
  default: {
    uploader: {
      upload_stream: uploadStreamMock,
      destroy: destroyMock,
    },
  },
}));

import { deleteImage, uploadImage } from "../../src/modules/media/media.service";

describe("media.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("uploadImage", () => {
    const buffer = Buffer.from("fake-image-content");
    const options = { folder: "laaggo/products" };

    const mockResult = {
      public_id: "laaggo/products/test-image",
      url: "http://res.cloudinary.com/demo/image/upload/test.jpg",
      secure_url: "https://res.cloudinary.com/demo/image/upload/test.jpg",
      format: "jpg",
      width: 800,
      height: 600,
      bytes: 102400,
    };

    const mockUploadStream = (
      error: Error | null = null,
      result: typeof mockResult | null = mockResult,
    ) => {
      uploadStreamMock.mockImplementation((_options, callback) => {
        const stream = new Writable({
          write(_chunk, _encoding, done) {
            done();
          },
        });

        stream.on("finish", () => {
          callback(error, result ?? undefined);
        });

        return stream;
      });
    };

    it("should upload an image successfully", async () => {
      mockUploadStream();

      const result = await uploadImage(buffer, options);

      expect(result).toEqual({
        publicId: mockResult.public_id,
        url: mockResult.url,
        secureUrl: mockResult.secure_url,
        format: mockResult.format,
        width: mockResult.width,
        height: mockResult.height,
        bytes: mockResult.bytes,
      });

      expect(uploadStreamMock).toHaveBeenCalledOnce();
      expect(uploadStreamMock).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: options.folder,
          resource_type: "image",
          transformation: [
            { quality: "auto", fetch_format: "auto" },
          ],
        }),
        expect.any(Function),
      );
    });

    it("should generate a public ID for the uploaded image", async () => {
      mockUploadStream();

      const result = await uploadImage(buffer, options);

      expect(result.publicId).toEqual(expect.any(String));
      expect(result.publicId.length).toBeGreaterThan(0);
    });

    it("should reject when Cloudinary upload fails", async () => {
      const uploadError = new Error("Cloudinary upload failed");

      mockUploadStream(uploadError);

      await expect(uploadImage(buffer, options)).rejects.toThrow(
        "Cloudinary upload failed",
      );
    });

    it("should reject when Cloudinary returns no result", async () => {
      mockUploadStream(null, null);

      await expect(uploadImage(buffer, options)).rejects.toThrow(
        "Cloudinary returned no upload result.",
      );
    });
  });

  describe("deleteImage", () => {
    const publicId = "laaggo/products/test-image";

    it("should delete an image successfully", async () => {
      destroyMock.mockResolvedValue({ result: "ok" });

      await expect(deleteImage(publicId)).resolves.toBeUndefined();

      expect(destroyMock).toHaveBeenCalledOnce();
      expect(destroyMock).toHaveBeenCalledWith(publicId, {
        resource_type: "image",
        invalidate: true,
      });
    });

    it("should not throw when the image is already deleted", async () => {
      destroyMock.mockResolvedValue({ result: "not found" });

      await expect(deleteImage(publicId)).resolves.toBeUndefined();
    });

    it("should reject when Cloudinary deletion fails", async () => {
      destroyMock.mockResolvedValue({ result: "error" });

      await expect(deleteImage(publicId)).rejects.toThrow(
        "Cloudinary deletion failed: error",
      );
    });

    it("should reject when Cloudinary API throws an error", async () => {
      destroyMock.mockRejectedValue(
        new Error("Cloudinary API unavailable"),
      );

      await expect(deleteImage(publicId)).rejects.toThrow(
        "Cloudinary API unavailable",
      );
    });
  });
});
