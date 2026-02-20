const { test, expect } = require("@playwright/test");
const {
  connectToFoundryBrowser,
  getMainPage,
  waitForFoundryReady,
  openRegionBehaviorSheet
} = require("../shared/foundry");

test("connect to Edge CDP and detect Foundry UI", async () => {
  const browser = await connectToFoundryBrowser();
  const page = await getMainPage(browser);

  await waitForFoundryReady(page);

  const status = await page.evaluate(() => {
    const module = game.modules.get("squeeze-it");
    const handlers = Hooks?.events?.renderRegionBehaviorConfig ?? [];
    const behaviorType = foundry?.data?.regionBehaviors?.ModifyMovementCostRegionBehaviorType;
    return {
      moduleKnown: Boolean(module),
      moduleActive: Boolean(module?.active),
      behaviorHookRegistered: handlers.length > 0,
      movementPatchInstalled: Boolean(behaviorType?.prototype?._squeezeItMovementPatched)
    };
  });

  expect(status.moduleKnown).toBeTruthy();
  expect(status.moduleActive).toBeTruthy();
  expect(status.behaviorHookRegistered).toBeTruthy();
  expect(status.movementPatchInstalled).toBeTruthy();

  await browser.close();
});

test("squeeze setting persists and tooltip renders line break", async () => {
  const browser = await connectToFoundryBrowser();
  const page = await getMainPage(browser);

  await openRegionBehaviorSheet(page, "Region", "Squeeze Med");

  const selectSelector = "form.region-behavior-config select[name='flags.squeeze-it.squeezeCreatureSize']";
  await page.selectOption(selectSelector, "med");
  await page.click("form.region-behavior-config button[type='submit']");

  await page.waitForTimeout(500);

  const savedFlag = await page.evaluate(() => {
    const region = canvas.scene?.regions?.contents?.find(regionDocument => regionDocument.name === "Region");
    const behavior = region?.behaviors?.contents?.find(behaviorDocument => behaviorDocument.name === "Squeeze Med");
    return behavior?.getFlag?.("squeeze-it", "squeezeCreatureSize") ?? null;
  });

  expect(savedFlag).toBe("med");

  await openRegionBehaviorSheet(page, "Region", "Squeeze Med");
  const reopenedValue = await page.locator(selectSelector).inputValue();
  expect(reopenedValue).toBe("med");

  const infoIconSelector = "form.region-behavior-config .foundry-squeezing-size-field i.fa-circle-info";
  await page.hover(infoIconSelector);
  await page.waitForTimeout(700);

  const tooltipDetails = await page.evaluate(() => {
    const tooltip = document.querySelector("#tooltip");
    return {
      paragraphCount: tooltip ? tooltip.querySelectorAll("p").length : 0,
      html: tooltip?.innerHTML ?? ""
    };
  });

  expect(tooltipDetails.paragraphCount).toBeGreaterThanOrEqual(2);
  expect(tooltipDetails.html).toContain("<strong>All:</strong>");
  expect(tooltipDetails.html).toContain("<strong>Specific size:</strong>");

  await browser.close();
});
