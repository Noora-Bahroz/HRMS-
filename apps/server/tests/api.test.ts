import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";

// These integration/API tests require a running PostgreSQL instance
// (DATABASE_URL) and the schema migrated + seeded. They are skipped when no
// database is available, or can be gated behind a flag.

const DB_AVAILABLE = process.env.RUN_DB_TESTS === "true";

describe("Health & API smoke", () => {
  beforeAll(async () => {
    if (!DB_AVAILABLE) return;
    try {
      await prisma.$connect();
    } catch {
      // no db
    }
  });

  afterAll(async () => {
    if (DB_AVAILABLE) await prisma.$disconnect();
  });

  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/v1 returns API metadata", async () => {
    const res = await request(app).get("/api/v1");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("HRMS API");
  });

  it("returns 404 for unknown route", async () => {
    const res = await request(app).get("/api/v1/nope");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/v1/auth/me without token is unauthorized", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });
});
