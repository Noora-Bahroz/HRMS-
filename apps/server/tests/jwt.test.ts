import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
  hashToken,
} from "../src/lib/jwt";

describe("jwt & hashing utilities", () => {
  describe("password hashing", () => {
    it("hashes and verifies a password", async () => {
      const hash = await hashPassword("Secret@123");
      expect(hash).not.toBe("Secret@123");
      await expect(verifyPassword("Secret@123", hash)).resolves.toBe(true);
      await expect(verifyPassword("Wrong", hash)).resolves.toBe(false);
    });
  });

  describe("access tokens", () => {
    it("signs and verifies a token, preserving claims", () => {
      const token = signAccessToken({ sub: "u1", tenantId: "t1", email: "a@b.c" });
      const payload = verifyAccessToken(token);
      expect(payload.sub).toBe("u1");
      expect(payload.tenantId).toBe("t1");
      expect(payload.type).toBe("access");
    });

    it("rejects a tampered token", () => {
      const token = signAccessToken({ sub: "u1", tenantId: "t1", email: "a@b.c" });
      const tampered = token.slice(0, -2) + "xx";
      expect(() => verifyAccessToken(tampered)).toThrow();
    });
  });

  describe("token hashing", () => {
    it("produces a deterministic sha256 hash", () => {
      expect(hashToken("abc")).toBe(hashToken("abc"));
      expect(hashToken("abc")).not.toBe(hashToken("abd"));
    });
  });
});
