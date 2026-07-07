import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import * as modulesController from "../controllers/platformModules.controller.js";

const router = Router();

router.use(authenticate, authorize("super_admin"));

router.get("/catalog", modulesController.getFeatureCatalog);
router.get("/", modulesController.listModules);
router.post("/", modulesController.createModule);
router.get("/:id", modulesController.getModule);
router.put("/:id", modulesController.updateModule);
router.delete("/:id", modulesController.deleteModule);

export default router;
