import { Router } from "express";

import { dashboardController } from "./dashboard.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";

const router = Router();

// All dashboard endpoints require admin access.
router.use(authenticate, requireAdmin);

router.get("/summary", dashboardController.getSummary);

export default router;