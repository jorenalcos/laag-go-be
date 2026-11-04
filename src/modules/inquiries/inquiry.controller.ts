
import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  createInquirySchema,
  updateInquirySchema,
  listInquiriesQuerySchema,
  inquiryParamsSchema,
} from "./inquiry.validation";

import {
  inquiryService,
  InquiryError,
} from "./inquiry.service";

function handleError(
  error: unknown,
  next: NextFunction,
  res: Response
) {
  if (error instanceof InquiryError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return next(error);
}

export const inquiryController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createInquirySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten(),
        });
      }

      const inquiry = await inquiryService.create(validation.data);

      return res.status(201).json({
        success: true,
        message: "Inquiry submitted successfully",
        data: { inquiry },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = listInquiriesQuerySchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: validation.error.flatten(),
        });
      }

      const result = await inquiryService.list(validation.data);

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
      const validation = inquiryParamsSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid inquiry ID",
        });
      }

      const inquiry = await inquiryService.getById(
        validation.data.id
      );

      return res.status(200).json({
        success: true,
        data: { inquiry },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = inquiryParamsSchema.safeParse(req.params);
      const body = updateInquirySchema.safeParse(req.body);

      if (!params.success || !body.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: {
            params: params.success
              ? undefined
              : params.error.flatten(),
            body: body.success
              ? undefined
              : body.error.flatten(),
          },
        });
      }

      const inquiry = await inquiryService.update(
        params.data.id,
        body.data
      );

      return res.status(200).json({
        success: true,
        message: "Inquiry updated successfully",
        data: { inquiry },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },
};
