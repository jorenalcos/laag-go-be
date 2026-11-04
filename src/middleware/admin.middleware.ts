import type { NextFunction, Response } from "express";

import { prisma } from "../lib/prisma";
import type { AuthRequest } from "./auth.middleware";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (ADMIN_EMAILS.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Platform administrator access is not configured",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive or unavailable",
      });
    }

    if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: "Platform administrator access required",
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}