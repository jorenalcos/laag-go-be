import { Router } from "express";

import { bookingController } from "./booking.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";

const router = Router();

// All booking management endpoints require admin access.
router.use(authenticate, requireAdmin);

router.post("/", bookingController.create);
router.get("/", bookingController.list);
router.get("/:id", bookingController.getById);
router.patch("/:id", bookingController.update);
router.patch("/:id/status", bookingController.changeStatus);

export default router;