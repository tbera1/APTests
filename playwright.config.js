// @ts-check
const { defineConfig } = require('@playwright/test');

require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',

  timeout: 60 * 1000,

  use: {
    baseURL: process.env.BASE_URL || 'https://RDV-010809.hylandqa.net/AppNet',

    headless: false,
    ignoreHTTPSErrors: true,

    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  metadata: {
    credentials: {
      username: process.env.USERNAME || 'qa',
      password: process.env.PASSWORD || 'qa'
    }
  }
});