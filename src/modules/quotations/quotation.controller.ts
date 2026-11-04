
import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  createQuotationSchema,
  updateQuotationSchema,
  changeQuotationStatusSchema,
  listQuotationsQuerySchema,
  quotationParamsSchema,
} from "./quotation.validation";

import {
  quotationService,
  QuotationError,
} from "./quotation.service";

function handleError(
  error: unknown,
  next: NextFunction,
  res: Response
) {
  if (error instanceof QuotationError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return next(error);
}

export const quotationController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createQuotationSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten(),
        });
      }

      const quotation = await quotationService.create(
        validation.data
      );

      return res.status(201).json({
        success: true,
        message: "Quotation created successfully",
        data: { quotation },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = listQuotationsQuerySchema.safeParse(
        req.query
      );

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: validation.error.flatten(),
        });
      }

      const result = await quotationService.list(validation.data);

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
      const validation = quotationParamsSchema.safeParse(
        req.params
      );

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid quotation ID",
        });
      }

      const quotation = await quotationService.getById(
        validation.data.id
      );

      return res.status(200).json({
        success: true,
        data: { quotation },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = quotationParamsSchema.safeParse(req.params);
      const body = updateQuotationSchema.safeParse(req.body);

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

      const quotation = await quotationService.update(
        params.data.id,
        body.data
      );

      return res.status(200).json({
        success: true,
        message: "Quotation updated successfully",
        data: { quotation },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },

  async changeStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const params = quotationParamsSchema.safeParse(req.params);
      const body = changeQuotationStatusSchema.safeParse(req.body);

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

      const quotation = await quotationService.changeStatus(
        params.data.id,
        body.data
      );

      return res.status(200).json({
        success: true,
        message: "Quotation status updated successfully",
        data: { quotation },
      });
    } catch (error) {
      return handleError(error, next, res);
    }
  },
};
