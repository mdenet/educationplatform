import express from "express";
import { StorageController } from "../controllers/StorageController.js";
import { asyncCatch } from "../middleware/ErrorHandlingMiddleware.js";
import { attachOctokit } from "../middleware/attachOctokit.js";

const router = express.Router();
const controller = new StorageController();

router.use(attachOctokit);

router.get("/file", asyncCatch(controller.getFile));
router.get("/branches", asyncCatch(controller.getBranches));
router.get("/compare-branches", asyncCatch(controller.compareBranches));

router.post("/store", asyncCatch(controller.storeFiles));
router.post("/create-branch", asyncCatch(controller.createBranch));
router.post("/merge-branches", asyncCatch(controller.mergeBranches));

export default router;
