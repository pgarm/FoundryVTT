import { registerMovementBehaviorPatch } from "./movement-provider.js";
import { registerRegionFlags } from "./region-flags.js";

Hooks.once("init", () => {
  registerMovementBehaviorPatch();
  registerRegionFlags();
});
