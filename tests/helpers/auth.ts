import type { Page } from "@playwright/test";

export async function loginAsManager(page: Page) {
	await page.context().addCookies([
		{
			name: "test-session",
			value: "true",
			domain: "localhost",
			path: "/",
		},
	]);
	await page.goto("/dashboard");
}
