const { chromium } = require("@playwright/test");

const CDP_URL = "http://127.0.0.1:9222";
const FOUNDRY_GAME_URL = "http://localhost:30000/game";

async function connectToFoundryBrowser() {
  return chromium.connectOverCDP(CDP_URL);
}

async function getMainPage(browser) {
  let context = browser.contexts()[0];
  if (!context) {
    try {
      context = await browser.newContext();
    } catch {
      throw new Error("No browser context found in CDP session. Open a Foundry tab in the remote browser and try again.");
    }
  }

  const existingPages = context.pages();
  const foundryPage = existingPages.find(page => page.url().includes("localhost:30000"));
  if (foundryPage) return foundryPage;

  const page = existingPages[0] ?? await context.newPage();
  await page.goto(FOUNDRY_GAME_URL, { waitUntil: "domcontentloaded" });
  return page;
}

async function waitForFoundryReady(page, timeout = 30000) {
  await page.waitForSelector("#ui-top, #join-game", { timeout });
  await page.waitForFunction(() => globalThis.game?.ready === true, null, { timeout });
}

async function openRegionBehaviorSheet(page, regionName, behaviorName) {
  await waitForFoundryReady(page);
  await page.evaluate(({ regionName, behaviorName }) => {
    const region = canvas.scene?.regions?.contents?.find(regionDocument => regionDocument.name === regionName);
    const behavior = region?.behaviors?.contents?.find(behaviorDocument => behaviorDocument.name === behaviorName);
    behavior?.sheet?.render(true);
  }, { regionName, behaviorName });

  await page.waitForSelector("form.region-behavior-config", { timeout: 10000 });
}

module.exports = {
  connectToFoundryBrowser,
  getMainPage,
  waitForFoundryReady,
  openRegionBehaviorSheet
};
