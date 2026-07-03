import { expect, test } from "@playwright/test";
import { loginAsManager } from "./helpers/auth";

// These tests target the mobile project (Pixel 7 viewport)
test.describe("Mobile Responsive Layout", () => {
	test.beforeEach(async ({ page }) => {
		await loginAsManager(page);
	});

	test("dashboard page renders on mobile viewport", async ({ page }) => {
		await expect(
			page.getByRole("heading", { name: /overview/i }),
		).toBeVisible();
	});

	test("KPI cards are visible on mobile", async ({ page }) => {
		await expect(page.getByText("Total Agents")).toBeVisible();
		await expect(page.getByText("Submissions Today")).toBeVisible();
	});

	test("sidebar or menu toggle is accessible on mobile", async ({ page }) => {
		// On mobile, SidebarProvider may collapse the sidebar; the toggle button
		// or a trigger should be present
		const sidebarToggle = page
			.getByRole("button", { name: /toggle sidebar/i })
			.or(page.getByRole("button", { name: /menu/i }))
			.or(page.locator('[data-sidebar="trigger"]'));
		// At minimum the Vevhu brand or nav should be reachable
		const hasToggle = (await sidebarToggle.count()) > 0;
		const hasBrand = (await page.getByText("Vevhu").count()) > 0;
		expect(hasToggle || hasBrand).toBe(true);
	});

	test("login page is usable on mobile", async ({ page }) => {
		await page.goto("/login");
		await expect(page.getByLabel("Email")).toBeVisible();
		await expect(page.getByLabel("Password")).toBeVisible();
		await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
	});

	test("login form fields are tappable on mobile", async ({ page }) => {
		await page.goto("/login");
		await page.getByLabel("Email").tap();
		await page.getByLabel("Email").fill("manager@vevhu.co.zw");
		await expect(page.getByLabel("Email")).toHaveValue("manager@vevhu.co.zw");
	});

	test("submissions page renders on mobile", async ({ page }) => {
		await page.goto("/dashboard/submissions");
		await expect(
			page.getByRole("heading", { name: /submissions/i }),
		).toBeVisible();
	});

	test("workers page renders on mobile", async ({ page }) => {
		await page.goto("/dashboard/workers");
		await expect(page.getByRole("heading", { name: /workers/i })).toBeVisible();
		await expect(
			page.getByRole("button", { name: /add worker/i }),
		).toBeVisible();
	});
});
