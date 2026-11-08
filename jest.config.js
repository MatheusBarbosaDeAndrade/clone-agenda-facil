const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "." });

module.exports = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  setupFiles: ["<rootDir>/tests/setup-env.js"],
  testTimeout: 60_000,
});
