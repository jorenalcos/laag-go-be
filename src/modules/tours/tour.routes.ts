import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";
import { tourController } from "./tour.controller";

const router = Router();

router.use(authenticate, requireAdmin);

router.post("/", tourController.create);
router.get("/", tourController.list);
router.get("/:id", tourController.getById);
router.patch("/:id", tourController.update);
router.patch("/:id/status", tourController.updateStatus);
router.delete("/:id", tourController.archive);

export default router;