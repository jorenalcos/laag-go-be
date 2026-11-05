import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  async getSummary(
    _req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const summary = await dashboardService.getSummary();

      return res.status(200).json({
        success: true,
        message: "Dashboard summary retrieved successfully",
        data: summary,
      });
    } catch (error) {
      return next(error);
    }
  },
};