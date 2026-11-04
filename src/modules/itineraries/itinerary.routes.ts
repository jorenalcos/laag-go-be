
import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";

import { itineraryController } from "./itinerary.controller";

const router = Router();

router.use(authenticate, requireAdmin);

// Itinerary templates
router.post("/", itineraryController.create);
router.get("/", itineraryController.list);
router.get("/:id", itineraryController.getById);
router.patch("/:id", itineraryController.update);
router.patch("/:id/status", itineraryController.updateStatus);
router.delete("/:id", itineraryController.archive);

// Itinerary stops
router.post("/:id/stops", itineraryController.addStop);
router.patch("/:id/stops/:stopId", itineraryController.updateStop);
router.delete("/:id/stops/:stopId", itineraryController.deleteStop);

export default router;
