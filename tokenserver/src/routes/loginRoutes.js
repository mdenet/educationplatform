import express from "express";
import { LoginController } from "../controllers/LoginController.js";
import { asyncCatch } from "../middleware/ErrorHandlingMiddleware.js";
import { githubApp } from "../config/githubApp.js";
import { attachOctokit } from "../middleware/attachOctokit.js";

const router = express.Router();
const controller = new LoginController(githubApp);

router.use(attachOctokit);

router.post("/url", asyncCatch(controller.getAuthUrl));
router.post("/token", asyncCatch(controller.createToken));
router.get("/validate", asyncCatch(controller.validateAuthCookie));

export default router;
