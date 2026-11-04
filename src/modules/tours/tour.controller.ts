import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  createTourSchema,
  updateTourSchema,
  updateTourStatusSchema,
  tourParamsSchema,
  listToursQuerySchema,
  publicToursQuerySchema,
} from "./tour.validation";

import {
  tourService,
  TourError,
} from "./tour.service";

function handleError(
  error: unknown,
  next: NextFunction,
  res: Response
) {
  if (error instanceof TourError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return next(error);
}

export const tourController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createTourSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten(),
        });
      }

      const tour = await tourService.create(validation.data);

      return res.status(201).json({
        success: true,
        message: "Tour created successfully",
        data: { tour },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = listToursQuerySchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: validation.error.flatten(),
        });
      }

      const result = await tourService.list(validation.data);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = tourParamsSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid tour ID",
        });
      }

      const tour = await tourService.getById(validation.data.id);

      return res.status(200).json({
        success: true,
        data: { tour },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = tourParamsSchema.safeParse(req.params);
      const body = updateTourSchema.safeParse(req.body);

      if (!params.success || !body.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: {
            params: params.success ? undefined : params.error.flatten(),
            body: body.success ? undefined : body.error.flatten(),
          },
        });
      }

      const tour = await tourService.update(
        params.data.id,
        body.data
      );

      return res.status(200).json({
        success: true,
        message: "Tour updated successfully",
        data: { tour },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const params = tourParamsSchema.safeParse(req.params);
      const body = updateTourStatusSchema.safeParse(req.body);

      if (!params.success || !body.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
        });
      }

      const tour = await tourService.updateStatus(
        params.data.id,
        body.data.status
      );

      return res.status(200).json({
        success: true,
        message: "Tour status updated successfully",
        data: { tour },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const params = tourParamsSchema.safeParse(req.params);

      if (!params.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid tour ID",
        });
      }

      const tour = await tourService.archive(params.data.id);

      return res.status(200).json({
        success: true,
        message: "Tour archived successfully",
        data: { tour },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async listPublic(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const validation = publicToursQuerySchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: validation.error.flatten(),
        });
      }

      const result = await tourService.listPublic(validation.data);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async getPublicBySlug(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const slug = req.params.slug;

      if (!slug || typeof slug !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid tour slug",
        });
      }

      const tour = await tourService.getPublicBySlug(slug);

      return res.status(200).json({
        success: true,
        data: { tour },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },
};