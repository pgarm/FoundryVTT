import { CreatureSize, MODULE_ID, SIZE_ALL, SIZE_FLAG } from "./constants.js";
import { SqueezeManager } from "./squeeze-manager.js";

const PATCH_FLAG = "_squeezeItMovementPatched";

function getBehaviorGate(behavior) {
  return behavior?.getFlag?.(MODULE_ID, SIZE_FLAG) ?? SIZE_ALL;
}

export function registerMovementBehaviorPatch() {
  const behaviorTypes = foundry?.data?.regionBehaviors;
  const klass = behaviorTypes?.ModifyMovementCostRegionBehaviorType;
  if (!klass || klass.prototype[PATCH_FLAG]) return;

  const original = klass.prototype._getTerrainEffects;
  if (typeof original !== "function") return;

  klass.prototype._getTerrainEffects = function patchedGetTerrainEffects(token, segment) {
    const effects = original.call(this, token, segment);
    const sizeKey = getBehaviorGate(this.behavior);
    if (!sizeKey || sizeKey === SIZE_ALL) return effects;

    const targetSize = CreatureSize.fromString(sizeKey);
    if (targetSize === null) return effects;

    const comparison = SqueezeManager.compareActorToTarget(token?.actor, targetSize);
    if (comparison === "unknown") return effects;
    if (comparison === "smaller") return [];
    if (comparison === "equal") return effects;
    if (comparison === "larger") return [{ name: "difficulty", difficulty: Infinity }];
  };

  klass.prototype[PATCH_FLAG] = true;
}