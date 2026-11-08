
import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/upload.middleware";
import { mediaController } from "./media.controller";

const router = Router();

router.post(
  "/upload",
  authenticate,
  upload.single("image"),
  mediaController.upload,
);

export default router;
