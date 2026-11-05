import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  createBookingSchema,
  updateBookingSchema,
  changeBookingStatusSchema,
  listBookingsQuerySchema,
  bookingParamsSchema,
} from "./booking.validation";

import {
  bookingService,
  BookingError,
} from "./booking.service";

function handleError(
  error: unknown,
  next: NextFunction,
  res: Response,
) {
  if (error instanceof BookingError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return next(error);
}

export const bookingController = {
  async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const validation = createBookingSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten(),
        });
      }

      const booking = await bookingService.create(validation.data);

      return res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: { booking },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async list(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const validation = listBookingsQuerySchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten(),
        });
      }

      const result = await bookingService.list(validation.data);

      return res.status(200).json({
        success: true,
        message: "Bookings retrieved successfully",
        data: result,
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const params = bookingParamsSchema.safeParse(req.params);

      if (!params.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking ID",
          errors: params.error.flatten(),
        });
      }

      const booking = await bookingService.getById(params.data.id);

      return res.status(200).json({
        success: true,
        message: "Booking retrieved successfully",
        data: { booking },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async update(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const params = bookingParamsSchema.safeParse(req.params);
      const body = updateBookingSchema.safeParse(req.body);

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

      const booking = await bookingService.update(
        params.data.id,
        body.data,
      );

      return res.status(200).json({
        success: true,
        message: "Booking updated successfully",
        data: { booking },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async changeStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const params = bookingParamsSchema.safeParse(req.params);
      const body = changeBookingStatusSchema.safeParse(req.body);

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

      const booking = await bookingService.changeStatus(
        params.data.id,
        body.data,
      );

      return res.status(200).json({
        success: true,
        message: "Booking status updated successfully",
        data: { booking },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },
};