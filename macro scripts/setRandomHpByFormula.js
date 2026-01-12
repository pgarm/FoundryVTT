// Foundry macro: roll actor HP formula and set current/max HP
// Logs every stage to console for debugging.
// Paste into a macro and run.

(async () => {
  console.log("HP Macro: start");

  // Helpers
  const hasFoundryGetProperty = (typeof foundry !== "undefined") && foundry?.utils?.getProperty;

  const safeGetProperty = (object, path) => {
    if (!path) return undefined;
    if (hasFoundryGetProperty) return foundry.utils.getProperty(object, path);
    if (typeof getProperty === "function") return getProperty(object, path);
    return path.split(".").reduce((acc, key) => acc?.[key], object);
  };

  const readHpSnapshot = (actorLike, rootPath) => ({
    value: safeGetProperty(actorLike, `${rootPath}.value`),
    max: safeGetProperty(actorLike, `${rootPath}.max`)
  });

  const logHpSnapshot = (label, actorName, snapshot, expectedValue) => {
    const valueText = snapshot.value ?? '<null>';
    const maxText = snapshot.max ?? '<null>';
    console.log(`${label} for ${actorName} -> value: ${valueText}, max: ${maxText}`);
    if (Number.isFinite(expectedValue)) {
      const matchesValue = snapshot.value === expectedValue;
      const matchesMax = snapshot.max === expectedValue;
      const verdict = matchesValue && matchesMax ? 'MATCH' : 'MISMATCH';
      console.log(`    Compared to rolled total ${expectedValue}: value match=${matchesValue}, max match=${matchesMax} (${verdict})`);
    }
  };

  function getHpFormula(actor) {
    const paths = [
      "system.attributes.hp.formula",
      "data.attributes.hp.formula",
      "data.data.attributes.hp.formula"
    ];
    for (const candidate of paths) {
      const value = safeGetProperty(actor, candidate);
      if (value) {
        return { formula: value, path: candidate };
      }
    }
    return { formula: null, path: null };
  }

  function hpRootPath(actor) {
    if (safeGetProperty(actor, "system.attributes.hp")) return "system.attributes.hp";
    if (safeGetProperty(actor, "data.attributes.hp")) return "data.attributes.hp";
    if (safeGetProperty(actor, "data.data.attributes.hp")) return "data.data.attributes.hp";
    return "system.attributes.hp";
  }

  // Tokens to process
  const tokens = canvas.tokens.controlled.length ? canvas.tokens.controlled : canvas.tokens.placeables;
  if (!tokens.length) {
    ui.notifications.warn("HP Macro: no tokens on canvas");
    console.log("HP Macro: no tokens on canvas - aborting");
    return;
  }

  console.log(`HP Macro: processing ${tokens.length} token(s)`);

  const actorUpdates = new Map(); // actorId -> { update, hpPath }
  const tokenUpdatePromises = [];

  for (const token of tokens) {
    try {
      console.log(`\n---\nToken: ${token.name} (id ${token.id})`);
      const actor = token.actor;
      if (!actor) {
        console.warn(`Token ${token.name} has no actor, skipping`);
        continue;
      }
      console.log(`Actor: ${actor.name} (id ${actor.id})`);

      const { formula, path: formulaPath } = getHpFormula(actor);
      console.log(`Read HP formula from ${formulaPath ?? "<none>"}: ${formula ?? "<none>"}`);
      if (!formula) {
        ui.notifications.warn(`No HP formula for actor ${actor.name}`);
        continue;
      }

      // Prepare roll data
      const rollData = (typeof actor.getRollData === "function") ? actor.getRollData() : (actor.data?.data ?? {});
      console.log("Roll data snapshot:", rollData);

      // Roll the formula
      let roll;
      try {
        roll = await new Roll(formula, rollData).evaluate();
      } catch (err) {
        console.error(`Roll failed for ${actor.name} with formula "${formula}":`, err);
        ui.notifications.error(`HP roll failed for ${actor.name}: ${err.message}`);
        continue;
      }

      // Log roll details
      console.log("Roll result object:", roll);
      const total = (typeof roll.total === "number") ? roll.total : Number(roll.result ?? NaN);
      console.log(`Computed HP total (rolled value): ${total}`);

      if (!Number.isFinite(total)) {
        console.warn(`Invalid HP total for ${actor.name}:`, total);
        ui.notifications.warn(`Invalid HP total for ${actor.name}`);
        continue;
      }

      // Determine linked vs unlinked token
      // token.document.actorLink is the canonical flag in v10; fallback to token.actorLink or token.actor?.isLinked
      const isLinked = (token.document && token.document.actorLink) ?? token.actorLink ?? token.actor?.isLinked ?? false;
      console.log(`Token linked to actor: ${isLinked}`);

      const hpPath = hpRootPath(actor); // e.g., "system.attributes.hp"
      console.log(`Detected HP root path: ${hpPath}`);
      logHpSnapshot("HP before update", actor.name, readHpSnapshot(actor, hpPath));

      if (isLinked) {
        // Update the Actor (affects all linked tokens)
        const actorId = actor.id;
        const existingPacket = actorUpdates.get(actorId) ?? { update: {}, hpPath };
        existingPacket.hpPath ??= hpPath;
        const updateObj = existingPacket.update;
        // Use dot-path keys so actor.update can apply nested changes
        updateObj[`${hpPath}.value`] = total;
        updateObj[`${hpPath}.max`] = total;
        actorUpdates.set(actorId, existingPacket);
        console.log(`Queued actor update for ${actor.name}:`, updateObj);
      } else {
        // Unlinked token: update only this token's embedded actor document
        const unlinkedActor = token.actor;
        if (!unlinkedActor) {
          console.warn(`Unlinked token ${token.name} has no actor reference`);
          continue;
        }

        const tokenActorUpdate = {
          [`${hpPath}.value`]: total,
          [`${hpPath}.max`]: total
        };

        console.log(`Applying token actor update for unlinked token ${token.name}:`, tokenActorUpdate);

        tokenUpdatePromises.push(
          unlinkedActor.update(tokenActorUpdate).then(() => {
            logHpSnapshot("HP after token update", token.name, readHpSnapshot(unlinkedActor, hpPath), total);
          }).catch(err => {
            console.error(`Failed to update unlinked token actor for ${token.name}:`, err);
            ui.notifications.error(`HP update failed for token ${token.name}: ${err.message}`);
          })
        );
      }
    } catch (err) {
      console.error("Unexpected error processing token:", token, err);
    }
  }

  // Apply actor updates (linked tokens)
  if (actorUpdates.size) {
    console.log("\nApplying actor updates for linked tokens...");
    for (const [actorId, packet] of actorUpdates) {
      const { update: updateObj, hpPath } = packet;
      try {
        const actor = game.actors.get(actorId);
        if (!actor) {
          console.warn(`Actor ${actorId} not found in game.actors`);
          continue;
        }
        console.log(`Updating actor ${actor.name} (id ${actorId}) with:`, updateObj);
        logHpSnapshot("Actor HP before linked update", actor.name, readHpSnapshot(actor, hpPath));
        await actor.update(updateObj);
        logHpSnapshot("Actor HP after linked update", actor.name, readHpSnapshot(actor, hpPath), updateObj[`${hpPath}.value`]);
        console.log(`Actor ${actor.name} updated successfully.`);
      } catch (err) {
        console.error(`Failed to update actor ${actorId}:`, err);
        ui.notifications.error(`Failed to update actor HP for ${actorId}: ${err.message}`);
      }
    }
  } else {
    console.log("No actor updates queued.");
  }

  // Apply token updates (unlinked tokens)
  if (tokenUpdatePromises.length) {
    console.log(`Applying ${tokenUpdatePromises.length} token update(s) for unlinked tokens...`);
    try {
      await Promise.all(tokenUpdatePromises);
      console.log("All token updates applied successfully.");
    } catch (err) {
      console.error("One or more token updates failed:", err);
      ui.notifications.error("One or more token updates failed. See console for details.");
    }
  } else {
    console.log("No token updates queued.");
  }

  ui.notifications.info("HP Macro: finished rolling and applying HP.");
  console.log("HP Macro: finished");
})();