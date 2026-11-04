import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes";
import adminRoutes from "../modules/auth/admin.routes";
import tourRoutes from "../modules/tours/tour.routes";
import publicTourRoutes from "../modules/tours/public-tour.routes";
import itineraryRoutes from "../modules/itineraries/itinerary.routes";
import {
  inquiryRoutes,
  publicInquiryRoutes,
} from "../modules/inquiries/inquiry.routes";
const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "LaagGo API is running",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);

router.use("/tours", tourRoutes);
router.use("/public/tours", publicTourRoutes);

router.use("/itineraries", itineraryRoutes);

router.use("/public/inquiries", publicInquiryRoutes);
router.use("/inquiries", inquiryRoutes);

export default router;