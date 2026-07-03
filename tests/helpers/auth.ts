import type { Page } from "@playwright/test";

export async function loginAsManager(page: Page) {
	await page.goto("/login");
	await page.getByLabel("Email").fill("manager@vevhu.co.zw");
	await page.getByLabel("Password").fill("password123");
	await page.getByRole("button", { name: /sign in/i }).click();
	await page.waitForURL("/dashboard");
}
