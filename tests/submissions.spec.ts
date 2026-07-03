import { expect, test } from "@playwright/test";
import { loginAsManager } from "./helpers/auth";

test.describe("Submissions Page", () => {
	test.beforeEach(async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/dashboard/submissions");
	});

	test("renders page heading", async ({ page }) => {
		await expect(
			page.getByRole("heading", { name: /submissions/i }),
		).toBeVisible();
	});

	test("renders table with expected columns", async ({ page }) => {
		await expect(
			page.getByRole("columnheader", { name: /worker/i }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: /stand/i }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: /respondent/i }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: /type/i }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: /status/i }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: /date/i }),
		).toBeVisible();
	});

	test("filter controls are visible", async ({ page }) => {
		await expect(page.getByPlaceholder(/filter by worker/i)).toBeVisible();
		await expect(page.getByText(/all statuses/i)).toBeVisible();
		await expect(page.getByText(/all zones/i)).toBeVisible();
	});

	test("worker filter input accepts text", async ({ page }) => {
		const filterInput = page.getByPlaceholder(/filter by worker/i);
		await filterInput.fill("test worker");
		await expect(filterInput).toHaveValue("test worker");
	});

	test("status filter dropdown opens and shows options", async ({ page }) => {
		await page.getByText(/all statuses/i).click();
		await expect(page.getByRole("option", { name: /pending/i })).toBeVisible();
		await expect(page.getByRole("option", { name: /complete/i })).toBeVisible();
		await expect(page.getByRole("option", { name: /flagged/i })).toBeVisible();
		await expect(page.getByRole("option", { name: /disputed/i })).toBeVisible();
	});

	test("table element is present", async ({ page }) => {
		await expect(page.getByRole("table")).toBeVisible();
	});

	test("clicking a table row navigates to submission detail page", async ({
		page,
	}) => {
		const rows = page.getByRole("row").filter({ has: page.locator("td") });
		const count = await rows.count();
		if (count === 0) {
			test.skip();
		} else {
			await rows.first().click();
			await expect(page).toHaveURL(/\/dashboard\/submissions\/.+/);
		}
	});
});
