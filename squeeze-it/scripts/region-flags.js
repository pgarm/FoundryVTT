import { DND5E_SIZE_OPTIONS, MODULE_ID, SIZE_ALL, SIZE_FLAG } from "./constants.js";

const MOVEMENT_BEHAVIOR_IDS = new Set([
  "multiplyMovementCost",
  "core.multiplyMovementCost",
  "ModifyMovementCost",
  "modifyMovementCost",
  "Modify Movement Cost",
  "MultiplyMovementCost"
]);

function asJQuery(element) {
  const jq = globalThis.jQuery ?? globalThis.$;
  if (!jq) throw new Error("Foundry jQuery unavailable");
  if (element?.jquery) return element;
  return jq(element);
}

function createSizeField(selectedValue = SIZE_ALL) {
  const fieldset = document.createElement("fieldset");
  fieldset.classList.add("foundry-squeezing-size-field");

  const legend = document.createElement("legend");
  legend.textContent = "Squeeze";
  fieldset.appendChild(legend);

  const group = document.createElement("div");
  group.classList.add("form-group");

  const label = document.createElement("label");
  label.textContent = "Creature Size";

  const info = document.createElement("i");
  info.classList.add("fa-solid", "fa-circle-info");
  info.style.marginLeft = "0.35rem";
  info.dataset.tooltipDirection = "UP";
  info.dataset.tooltipClass = "squeeze-tooltip";
  info.dataset.tooltipHtml = [
    "<p><strong>All:</strong> normal multiplier behavior, applies to all creatures.</p>",
    "<p><strong>Specific size:</strong> smaller creatures ignore multiplier, selected size uses multiplier, larger creatures cannot enter.</p>"
  ].join("");
  info.setAttribute("aria-label", "Squeeze size behavior details");

  label.appendChild(info);
  group.appendChild(label);

  const fields = document.createElement("div");
  fields.classList.add("form-fields");

  const select = document.createElement("select");
  select.name = `flags.${MODULE_ID}.${SIZE_FLAG}`;

  for (const { value, label: optionLabel } of DND5E_SIZE_OPTIONS) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = optionLabel;
    if (value === selectedValue) option.selected = true;
    select.appendChild(option);
  }

  fields.appendChild(select);
  group.appendChild(fields);
  fieldset.appendChild(group);

  return fieldset;
}

function includesMovementLanguage(value) {
  if (!value) return false;
  const normalized = String(value).toLowerCase();
  return normalized.includes("movement") && (normalized.includes("modify") || normalized.includes("multiply"));
}

function matchesMovementBehavior(value) {
  if (!value) return false;
  if (MOVEMENT_BEHAVIOR_IDS.has(value)) return true;
  return includesMovementLanguage(value);
}

function collectBehaviorHints(app, html) {
  const hints = [];
  const doc = app.object ?? app.document;
  const $html = asJQuery(html);

  if (doc) {
    hints.push(
      doc.behavior,
      doc.behaviorId,
      doc.behaviorType,
      doc.type,
      doc.key,
      doc.slug,
      doc.id,
      doc.name
    );
  }

  hints.push(app.title, app.options?.title);
  const header = ($html.find(".window-title").text() || "").trim();
  hints.push(header);

  $html.find("legend, h1, h2, h3, h4, .behavior-title, .behavior-header").each((_, el) => {
    hints.push(el.textContent?.trim());
  });

  return hints.filter(Boolean);
}

function isMovementBehaviorSheet(app, html) {
  return collectBehaviorHints(app, html).some(matchesMovementBehavior);
}

function getBehaviorFlagValue(source) {
  return source?.getFlag?.(MODULE_ID, SIZE_FLAG) ?? SIZE_ALL;
}

function injectBehaviorSheet(app, html) {
  if (!isMovementBehaviorSheet(app, html)) return;

  const $html = asJQuery(html);
  const selectedValue = getBehaviorFlagValue(app.document ?? app.object);

  const target =
    $html.find("section[data-application-part='form']").last().get(0) ??
    $html.find("form").get(0) ??
    $html.get(0);

  if (!target) return;

  target.querySelectorAll?.(".foundry-squeezing-size-field").forEach(el => el.remove());
  const field = createSizeField(selectedValue);
  target.appendChild(field);

  if (typeof app.setPosition === "function") {
    app.setPosition({ height: "auto" });
  }
}

export function registerRegionFlags() {
  Hooks.on("renderRegionBehaviorConfig", (app, html) => {
    injectBehaviorSheet(app, html);
  });
}