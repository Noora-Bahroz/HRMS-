import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/validate";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

healthRouter.get(
  "/readiness",
  asyncHandler(async (_req, res) => {
    const checks: Record<string, string> = {};
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = "ok";
    } catch {
      checks.database = "error";
    }
    const ready = Object.values(checks).every((v) => v === "ok");
    res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not_ready", checks });
  })
);

// OpenTelemetry / Prometheus metrics endpoint (placeholder; real metrics via otel exporter)
healthRouter.get("/metrics", (_req, res) => {
  res.set("Content-Type", "text/plain; version=0.0.4");
  res.send(`# HELP hrms_up Whether the service is up.\n# TYPE hrms_up gauge\nhrms_up 1\n`);
});
