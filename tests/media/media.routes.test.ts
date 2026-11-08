
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { uploadImage } from "../../src/modules/media/media.service";

vi.mock("../../src/middleware/auth.middleware", () => ({
  authenticate: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => next(),
}));

vi.mock("../../src/modules/media/media.service", () => ({
  uploadImage: vi.fn(),
}));

import mediaRoutes from "../../src/modules/media/media.routes";

describe("media.routes", () => {
  const app = express();

  const mockUploadedImage = {
    publicId: "laaggo/products/test-image",
    url: "http://res.cloudinary.com/demo/test.jpg",
    secureUrl: "https://res.cloudinary.com/demo/test.jpg",
    format: "jpg",
    width: 800,
    height: 600,
    bytes: 102400,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    app.use("/media", mediaRoutes);
  });

  it("should upload an image successfully", async () => {
    vi.mocked(uploadImage).mockResolvedValue(mockUploadedImage);

    const response = await request(app)
      .post("/media/upload")
      .attach("image", Buffer.from("fake-image-content"), {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      success: true,
      message: "Image uploaded successfully.",
      data: mockUploadedImage,
    });

    expect(uploadImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      { folder: "laaggo/products" },
    );
  });

  it("should return 400 when no image is provided", async () => {
    const response = await request(app)
      .post("/media/upload");

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      success: false,
      message: "Please provide an image file.",
    });

    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("should reject an unsupported file type", async () => {
    const response = await request(app)
      .post("/media/upload")
      .attach("image", Buffer.from("fake-document-content"), {
        filename: "document.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(500);
    expect(uploadImage).not.toHaveBeenCalled();
  });
});
