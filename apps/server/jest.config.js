/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  clearMocks: true,
};
