
import { Router } from "express";

import { quotationController } from "./quotation.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";

const router = Router();

// All quotation management endpoints require admin access.
router.use(authenticate, requireAdmin);

router.post("/", quotationController.create);
router.get("/", quotationController.list);
router.get("/:id", quotationController.getById);
router.patch("/:id", quotationController.update);
router.patch("/:id/status", quotationController.changeStatus);

export default router;
