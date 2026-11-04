import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";

const router = Router();

router.get("/check", authenticate, requireAdmin, (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Platform administrator access verified",
  });
});

export default router;