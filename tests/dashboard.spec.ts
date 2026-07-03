import { expect, test } from "@playwright/test";
import { loginAsManager } from "./helpers/auth";

test.describe("Dashboard Overview", () => {
	test.beforeEach(async ({ page }) => {
		await loginAsManager(page);
	});

	test("renders KPI cards", async ({ page }) => {
		await expect(page.getByText("Total Agents")).toBeVisible();
		await expect(page.getByText("Submissions Today")).toBeVisible();
		await expect(page.getByText("Locations Covered")).toBeVisible();
		await expect(page.getByText("Completion Rate")).toBeVisible();
	});

	test("renders overview heading", async ({ page }) => {
		await expect(
			page.getByRole("heading", { name: /overview/i }),
		).toBeVisible();
	});

	test("navigation sidebar is visible with nav items", async ({ page }) => {
		await expect(page.getByText("Vevhu")).toBeVisible();
		await expect(page.getByRole("link", { name: /overview/i })).toBeVisible();
		await expect(
			page.getByRole("link", { name: /submissions/i }),
		).toBeVisible();
		await expect(page.getByRole("link", { name: /map view/i })).toBeVisible();
		await expect(page.getByRole("link", { name: /analytics/i })).toBeVisible();
		await expect(
			page.getByRole("link", { name: /form builder/i }),
		).toBeVisible();
	});

	test("clicking Submissions nav item navigates to /dashboard/submissions", async ({
		page,
	}) => {
		await page.getByRole("link", { name: /submissions/i }).click();
		await expect(page).toHaveURL("/dashboard/submissions");
	});

	test("clicking Map View nav item navigates to /dashboard/map", async ({
		page,
	}) => {
		await page.getByRole("link", { name: /map view/i }).click();
		await expect(page).toHaveURL("/dashboard/map");
	});

	test("clicking Analytics nav item navigates to /dashboard/analytics", async ({
		page,
	}) => {
		await page.getByRole("link", { name: /analytics/i }).click();
		await expect(page).toHaveURL("/dashboard/analytics");
	});

	test("clicking Form Builder nav item navigates to /dashboard/form-builder", async ({
		page,
	}) => {
		await page.getByRole("link", { name: /form builder/i }).click();
		await expect(page).toHaveURL("/dashboard/form-builder");
	});

	test("Recent Submissions and Agent Activity cards are present", async ({
		page,
	}) => {
		await expect(page.getByText("Recent Submissions")).toBeVisible();
		await expect(page.getByText("Agent Activity")).toBeVisible();
	});
});
