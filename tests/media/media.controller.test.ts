
import type { Request, Response, NextFunction } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mediaController } from "../../src/modules/media/media.controller";
import { uploadImage } from "../../src/modules/media/media.service";

vi.mock("../../src/modules/media/media.service", () => ({
  uploadImage: vi.fn(),
}));

describe("media.controller", () => {
  const mockUploadedImage = {
    publicId: "laaggo/products/test-image",
    url: "http://res.cloudinary.com/demo/test.jpg",
    secureUrl: "https://res.cloudinary.com/demo/test.jpg",
    format: "jpg",
    width: 800,
    height: 600,
    bytes: 102400,
  };

  const mockFileBuffer = Buffer.from("fake-image-content");

  let req: Request;
  let res: Response;
  let next: NextFunction;

  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let nextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      file: {
        buffer: mockFileBuffer,
      },
    } as unknown as Request;

    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn().mockReturnThis();
    nextMock = vi.fn();

    res = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;

    next = nextMock as unknown as NextFunction;
  });

  describe("upload", () => {
    it("should upload an image successfully", async () => {
      vi.mocked(uploadImage).mockResolvedValue(mockUploadedImage);

      await mediaController.upload(req, res, next);

      expect(uploadImage).toHaveBeenCalledWith(
        mockFileBuffer,
        { folder: "laaggo/products" },
      );

      expect(statusMock).toHaveBeenCalledWith(201);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Image uploaded successfully.",
        data: mockUploadedImage,
      });

      expect(nextMock).not.toHaveBeenCalled();
    });

    it("should return 400 when no image file is provided", async () => {
      req = {} as Request;

      await mediaController.upload(req, res, next);

      expect(statusMock).toHaveBeenCalledWith(400);

      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Please provide an image file.",
      });

      expect(uploadImage).not.toHaveBeenCalled();
      expect(nextMock).not.toHaveBeenCalled();
    });

    it("should forward errors to the next middleware", async () => {
      const uploadError = new Error("Cloudinary upload failed");

      vi.mocked(uploadImage).mockRejectedValue(uploadError);

      await mediaController.upload(req, res, next);

      expect(nextMock).toHaveBeenCalledWith(uploadError);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });
});
