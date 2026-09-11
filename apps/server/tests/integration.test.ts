import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";

// These integration tests require a live, migrated, seeded PostgreSQL database.
// Enable with: RUN_DB_TESTS=true npm test
// They are skipped by default so the unit-only suite runs anywhere.
const RUN = process.env.RUN_DB_TESTS === "true";

describe("Integration: Auth + Employee (DB)", () => {
  const skip = RUN ? it : it.skip;
  let accessToken: string;

  beforeAll(async () => {
    if (!RUN) return;
    await prisma.$connect();
    // Seed data must exist (super admin admin@hrms.local / Admin@123)
  });

  afterAll(async () => {
    if (RUN) await prisma.$disconnect();
  });

  skip("logs in as seeded super admin", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "admin@hrms.local",
      password: "Admin@123",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    accessToken = res.body.data.accessToken;
  });

  skip("returns current user with roles/permissions", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("admin@hrms.local");
    expect(Array.isArray(res.body.data.roles)).toBe(true);
  });

  skip("creates and lists an employee", async () => {
    const email = `test.${Date.now()}@hrms.local`;
    const create = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        firstName: "Integration",
        lastName: "Tester",
        email,
        phone: "123",
        companyId: (await prisma.company.findFirstOrThrow()).id,
      });
    expect(create.status).toBe(201);
    expect(create.body.data.employeeNumber).toMatch(/^EMP-/);

    const list = await request(app)
      .get("/api/v1/employees")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ search: "Integration" });
    expect(list.status).toBe(200);
    expect(list.body.data.some((e: { email: string }) => e.email === email)).toBe(true);
  });

  skip("enforces RBAC - super admin can process payroll endpoint result", async () => {
    const res = await request(app)
      .get("/api/v1/reports/headcount")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });
});
