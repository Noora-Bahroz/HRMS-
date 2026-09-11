import { Router } from "express";
import * as controller from "./auth.controller";
import { validate } from "../../utils/validate";
import { changePasswordSchema, loginSchema, logoutSchema, refreshSchema, signupSchema } from "./auth.validation";
import { authenticate } from "../../middleware/auth";
import { authLimiter } from "../../middleware/rateLimit";

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate a user
 *     tags: [Auth]
 */
router.post("/login", authLimiter, validate(loginSchema), controller.login);
router.post("/signup", authLimiter, validate(signupSchema), controller.signup);
router.post("/refresh", validate(refreshSchema), controller.refresh);
router.post("/logout", validate(logoutSchema), controller.logout);
router.post("/change-password", authenticate, validate(changePasswordSchema), controller.changePassword);
router.get("/me", authenticate, controller.me);

export default router;
