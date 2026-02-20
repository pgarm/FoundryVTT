const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  use: {
    headless: process.env.PLAYWRIGHT_HEADLESS === "false" ? false : true
  },
  reporter: [["list"]]
});
