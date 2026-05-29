import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const BASE_URL = process.env.APP_URL ?? "https://ptr-tracker.vercel.app";
const USERNAME = process.env.APP_USERNAME ?? "ptr_admin";
const PASSWORD = process.env.APP_PASSWORD ?? process.env.PTR_APP_PASSWORD;

if (!PASSWORD) {
  console.error("Missing password. Set APP_PASSWORD or PTR_APP_PASSWORD before running this script.");
  process.exit(1);
}

const outputDir = path.resolve("docs/screenshots");

async function saveScreenshot(page, fileName, fullPage = false) {
  const outputPath = path.join(outputDir, fileName);
  await page.screenshot({ path: outputPath, fullPage });
  console.log(`Saved ${fileName}`);
}

async function waitForDashboard(page) {
  await page.waitForSelector("button:has-text('Dashboard')", { timeout: 30000 });
  await page.waitForSelector("text=Pathway Command Center", { timeout: 30000 });
}

async function loginIfNeeded(page) {
  const usernameInput = page.getByPlaceholder("Username");
  const passwordInput = page.getByPlaceholder("Password");

  if ((await usernameInput.count()) === 0 || (await passwordInput.count()) === 0) {
    return;
  }

  await saveScreenshot(page, "01-login-screen.png", false);
  await usernameInput.fill(USERNAME);
  await passwordInput.fill(PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await waitForDashboard(page);
}

async function captureDesktopScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 }
  });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await loginIfNeeded(page);
  await waitForDashboard(page);

  await saveScreenshot(page, "02-dashboard-overview.png", false);

  const exportHeader = page.getByRole("heading", { name: "Export and Reporting" });
  await exportHeader.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await saveScreenshot(page, "03-dashboard-reporting-panel.png", false);

  await page.getByRole("button", { name: "Student Pokedex" }).click();
  await page.waitForSelector("input[placeholder='Search by name or email']", { timeout: 30000 });
  await saveScreenshot(page, "04-student-pokedex.png", false);

  await page.getByRole("button", { name: "Open Profile" }).first().click();
  await page.waitForSelector("text=Student Profile", { timeout: 30000 });
  await saveScreenshot(page, "05-student-profile.png", false);
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Assignment Matrix" }).click();
  await page.waitForSelector("text=Create Assignment for All Students", { timeout: 30000 });
  await saveScreenshot(page, "06-assignment-matrix.png", false);

  await page.locator("nav button", { hasText: "Attendance" }).click();
  await page.waitForSelector("text=Create Attendance Session", { timeout: 30000 });
  await saveScreenshot(page, "07-attendance.png", false);

  await page.locator("nav button", { hasText: "Archive" }).click();
  await page.waitForSelector("text=No archived students", { timeout: 30000 });
  await saveScreenshot(page, "08-archive-view.png", false);

  await context.close();
  await browser.close();
}

async function captureMobileScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 }
  });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await loginIfNeeded(page);
  await waitForDashboard(page);
  await saveScreenshot(page, "09-mobile-dashboard.png", false);

  await context.close();
  await browser.close();
}

await mkdir(outputDir, { recursive: true });
await captureDesktopScreenshots();
await captureMobileScreenshot();

console.log(`All screenshots saved to ${outputDir}`);
