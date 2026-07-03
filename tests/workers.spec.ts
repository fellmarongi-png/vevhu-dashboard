import { expect, test } from "@playwright/test";
import { loginAsManager } from "./helpers/auth";

test.describe("Worker Management", () => {
	test.beforeEach(async ({ page }) => {
		await loginAsManager(page);
		await page.goto("/dashboard/workers");
	});

	test("renders page heading", async ({ page }) => {
		await expect(page.getByRole("heading", { name: /workers/i })).toBeVisible();
	});

	test("renders Add Worker button", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /add worker/i }),
		).toBeVisible();
	});

	test("workers table is visible with expected columns", async ({ page }) => {
		await expect(
			page.getByRole("columnheader", { name: /name/i }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: /zone/i }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: /status/i }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: /actions/i }),
		).toBeVisible();
	});

	test("clicking Add Worker opens dialog with form", async ({ page }) => {
		await page.getByRole("button", { name: /add worker/i }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /add worker/i }),
		).toBeVisible();
		await expect(page.getByLabel(/full name/i)).toBeVisible();
		await expect(page.getByLabel(/phone/i)).toBeVisible();
		await expect(page.getByLabel(/zone/i)).toBeVisible();
		await expect(page.getByLabel(/daily target/i)).toBeVisible();
		await expect(page.getByLabel(/pin/i)).toBeVisible();
	});

	test("worker form fields accept input", async ({ page }) => {
		await page.getByRole("button", { name: /add worker/i }).click();
		await page.getByLabel(/full name/i).fill("Jane Doe");
		await page.getByLabel(/phone/i).fill("+263771234567");
		await page.getByLabel(/zone/i).fill("Zone A");
		await page.getByLabel(/daily target/i).fill("15");
		await page.getByLabel(/pin/i).fill("1234");

		await expect(page.getByLabel(/full name/i)).toHaveValue("Jane Doe");
		await expect(page.getByLabel(/phone/i)).toHaveValue("+263771234567");
		await expect(page.getByLabel(/zone/i)).toHaveValue("Zone A");
		await expect(page.getByLabel(/daily target/i)).toHaveValue("15");
	});

	test("submitting the form triggers Add Worker button in dialog", async ({
		page,
	}) => {
		await page.getByRole("button", { name: /add worker/i }).click();
		await page.getByLabel(/full name/i).fill("Test Worker");
		await page.getByLabel(/phone/i).fill("+263771234567");
		await page.getByLabel(/zone/i).fill("Zone B");
		await page.getByLabel(/daily target/i).fill("10");
		await page.getByLabel(/pin/i).fill("5678");
		// The submit button inside the form dialog
		await expect(
			page.getByRole("button", { name: /add worker/i }).last(),
		).toBeVisible();
	});
});
