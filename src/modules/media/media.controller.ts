
import type { Request, Response, NextFunction } from "express";

import { uploadImage } from "./media.service";

export const mediaController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please provide an image file.",
        });
      }

      const folder = "laaggo/products";

      const image = await uploadImage(req.file.buffer, { folder });

      return res.status(201).json({
        success: true,
        message: "Image uploaded successfully.",
        data: image,
      });
    } catch (error) {
      next(error);
    }
  },
};
