import { ApiError, paginate, getPagination } from "../src/utils/http";

describe("http utils", () => {
  describe("paginate", () => {
    it("computes meta correctly", () => {
      const meta = paginate(2, 20, 45);
      expect(meta.page).toBe(2);
      expect(meta.limit).toBe(20);
      expect(meta.total).toBe(45);
      expect(meta.totalPages).toBe(3);
    });

    it("clamps limit and page to safe ranges", () => {
      expect(paginate(0, 500, 10).page).toBe(1);
      expect(paginate(1, 0, 10).limit).toBe(1);
      expect(paginate(1, 500, 10).limit).toBe(100);
    });
  });

  describe("getPagination", () => {
    it("parses query params with defaults", () => {
      expect(getPagination({})).toEqual({ page: 1, limit: 20 });
      expect(getPagination({ page: "3", limit: "5" })).toEqual({ page: 3, limit: 5 });
    });
  });

  describe("ApiError", () => {
    it("builds a 404", () => {
      const err = ApiError.notFound("missing");
      expect(err.status).toBe(404);
      expect(err.code).toBe("NOT_FOUND");
    });
  });
});
