
import { Router } from "express";

import { inquiryController } from "./inquiry.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";

// Public guest inquiry submission
export const publicInquiryRoutes = Router();

publicInquiryRoutes.post("/", inquiryController.create);

// Protected inquiry management
export const inquiryRoutes = Router();

inquiryRoutes.use(authenticate, requireAdmin);

inquiryRoutes.get("/", inquiryController.list);
inquiryRoutes.get("/:id", inquiryController.getById);
inquiryRoutes.patch("/:id", inquiryController.update);
