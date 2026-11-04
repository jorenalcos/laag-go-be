
import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  createItinerarySchema,
  updateItinerarySchema,
  updateItineraryStatusSchema,
  createItineraryStopSchema,
  updateItineraryStopSchema,
  itineraryParamsSchema,
  itineraryStopParamsSchema,
  listItinerariesQuerySchema,
} from "./itinerary.validation";

import {
  itineraryService,
  ItineraryError,
} from "./itinerary.service";

function handleError(
  error: unknown,
  next: NextFunction,
  res: Response
) {
  if (error instanceof ItineraryError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return next(error);
}

export const itineraryController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createItinerarySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten(),
        });
      }

      const itinerary = await itineraryService.create(validation.data);

      return res.status(201).json({
        success: true,
        message: "Itinerary created successfully",
        data: { itinerary },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = listItinerariesQuerySchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: validation.error.flatten(),
        });
      }

      const result = await itineraryService.list(validation.data);

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
      const validation = itineraryParamsSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid itinerary ID",
        });
      }

      const itinerary = await itineraryService.getById(
        validation.data.id
      );

      return res.status(200).json({
        success: true,
        data: { itinerary },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = itineraryParamsSchema.safeParse(req.params);
      const body = updateItinerarySchema.safeParse(req.body);

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

      const itinerary = await itineraryService.update(
        params.data.id,
        body.data
      );

      return res.status(200).json({
        success: true,
        message: "Itinerary updated successfully",
        data: { itinerary },
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
      const params = itineraryParamsSchema.safeParse(req.params);
      const body = updateItineraryStatusSchema.safeParse(req.body);

      if (!params.success || !body.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
        });
      }

      const itinerary = await itineraryService.updateStatus(
        params.data.id,
        body.data.status
      );

      return res.status(200).json({
        success: true,
        message: "Itinerary status updated successfully",
        data: { itinerary },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const params = itineraryParamsSchema.safeParse(req.params);

      if (!params.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid itinerary ID",
        });
      }

      const itinerary = await itineraryService.archive(
        params.data.id
      );

      return res.status(200).json({
        success: true,
        message: "Itinerary archived successfully",
        data: { itinerary },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async addStop(req: Request, res: Response, next: NextFunction) {
    try {
      const params = itineraryParamsSchema.safeParse(req.params);
      const body = createItineraryStopSchema.safeParse(req.body);

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

      const itinerary = await itineraryService.addStop(
        params.data.id,
        body.data
      );

      return res.status(201).json({
        success: true,
        message: "Itinerary stop added successfully",
        data: { itinerary },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async updateStop(req: Request, res: Response, next: NextFunction) {
    try {
      const params = itineraryStopParamsSchema.safeParse(req.params);
      const body = updateItineraryStopSchema.safeParse(req.body);

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

      const itinerary = await itineraryService.updateStop(
        params.data.id,
        params.data.stopId,
        body.data
      );

      return res.status(200).json({
        success: true,
        message: "Itinerary stop updated successfully",
        data: { itinerary },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async deleteStop(req: Request, res: Response, next: NextFunction) {
    try {
      const params = itineraryStopParamsSchema.safeParse(req.params);

      if (!params.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid itinerary or stop ID",
        });
      }

      const itinerary = await itineraryService.deleteStop(
        params.data.id,
        params.data.stopId
      );

      return res.status(200).json({
        success: true,
        message: "Itinerary stop deleted successfully",
        data: { itinerary },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },
};
