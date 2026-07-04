import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
	test("login page renders correctly", async ({ page }) => {
		await page.goto("/login");
		await expect(
			page.getByRole("heading", { name: /vevhu (resources|dashboard)/i }),
		).toBeVisible();
		await expect(page.getByLabel("Email")).toBeVisible();
		await expect(page.getByLabel("Password")).toBeVisible();
		await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
	});

	test("successful login redirects to /dashboard", async ({ page }) => {
		await page.goto("/login");
		await page.getByLabel("Email").fill("manager@vevhu.co.zw");
		await page.getByLabel("Password").fill("password123");
		await page.getByRole("button", { name: /sign in/i }).click();
		await expect(page).toHaveURL("/dashboard");
	});

	test("invalid credentials shows error message", async ({ page }) => {
		await page.goto("/login");
		await page.getByLabel("Email").fill("wrong@example.com");
		await page.getByLabel("Password").fill("wrongpassword");
		await page.getByRole("button", { name: /sign in/i }).click();
		// Error alert should appear (Supabase returns an error message)
		await expect(page.getByRole("alert")).toBeVisible();
	});

	test("empty form shows browser validation", async ({ page }) => {
		await page.goto("/login");
		await page.getByRole("button", { name: /sign in/i }).click();
		// The email input is required, so the form should not submit
		await expect(page).toHaveURL("/login");
	});
});
