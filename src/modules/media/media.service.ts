
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

import cloudinary from "../../lib/cloudinary";

export interface UploadImageOptions {
  folder: string;
}

export interface UploadedImage {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export const uploadImage = (
  buffer: Buffer,
  options: UploadImageOptions,
): Promise<UploadedImage> => {
  return new Promise((resolve, reject) => {
    const publicId = randomUUID();

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: publicId,
        resource_type: "image",
        transformation: [
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(new Error("Cloudinary returned no upload result."));
        }

        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary deletion failed: ${result.result}`);
  }
};
