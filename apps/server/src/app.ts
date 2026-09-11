import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { config } from "./config";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/user.routes";
import rolesRouter from "./modules/users/roles.routes";
import orgRoutes from "./modules/organization/organization.routes";
import employeeRoutes from "./modules/employees/employee.routes";
import leaveRoutes from "./modules/leave/leave.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import payrollRoutes from "./modules/payroll/payroll.routes";
import expenseRoutes from "./modules/expense/expense.routes";
import assetRoutes from "./modules/assets/asset.routes";
import atsRoutes from "./modules/recruitment/ats.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import reportRoutes from "./modules/reports/report.routes";
import { globalLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { healthRouter } from "./modules/health/health.routes";
import logger from "./lib/logger";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin.split(","),
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.env === "production" ? "combined" : "dev"));
app.use(globalLimiter);

// Health
app.use("/health", healthRouter);

// API v1
const apiRouter = express.Router();
apiRouter.get("/", (_req, res) =>
  res.json({ name: "HRMS API", version: "1.0.0", docs: "/api/v1/docs" })
);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/roles", rolesRouter);
apiRouter.use("/organization", orgRoutes);
apiRouter.use("/employees", employeeRoutes);
apiRouter.use("/leave", leaveRoutes);
apiRouter.use("/attendance", attendanceRoutes);
apiRouter.use("/payroll", payrollRoutes);
apiRouter.use("/expenses", expenseRoutes);
apiRouter.use("/assets", assetRoutes);
apiRouter.use("/recruitment", atsRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/reports", reportRoutes);

app.use("/api/v1", apiRouter);

// Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "HRMS API", version: "1.0.0" },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: ["./src/modules/**/*.routes.ts", "./src/modules/**/*.controller.ts"],
});
app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(notFoundHandler);
app.use(errorHandler);

logger.info("Express app assembled");

export default app;
