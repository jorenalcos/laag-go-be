import type { NextFunction, Request, Response } from "express";

import { authService, AuthError } from "./auth.service";
import { loginSchema } from "./auth.validation";
import type { AuthRequest } from "../../middleware/auth.middleware";

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = loginSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten(),
        });
      }

      const result = await authService.login(validation.data);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      next(error);
    }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const user = await authService.getCurrentUser(req.user.id);

      return res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      next(error);
    }
  },

  logout(_req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      message: "Logout successful. Discard your access token.",
    });
  },
};