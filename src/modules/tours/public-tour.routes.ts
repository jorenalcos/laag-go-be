import { Router } from "express";

import { tourController } from "./tour.controller";

const router = Router();

router.get("/", tourController.listPublic);
router.get("/:slug", tourController.getPublicBySlug);

export default router;