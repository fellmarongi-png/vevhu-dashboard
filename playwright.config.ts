import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	webServer: {
		command: "npm run start",
		url: "http://localhost:3000",
		reuseExistingServer: false,
		timeout: 30000,
		env: { PLAYWRIGHT_TEST: "true" },
	},
	use: { baseURL: "http://localhost:3000", screenshot: "only-on-failure" },
	projects: [
		{ name: "desktop", use: { ...devices["Desktop Chrome"] } },
		{ name: "mobile", use: { ...devices["Pixel 7"] } },
	],
});
