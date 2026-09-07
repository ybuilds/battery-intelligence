import { defaultPreferences } from "../data/default-preferences";
import { sampleBattery } from "../data/sample-battery";
import { sampleBehaviour } from "../data/sample-behaviour";

import { evaluateAllInterventions, selectBestOutcome } from "./outcome-model";

export function testOutcomeModel() {
  const outcomes = evaluateAllInterventions(
    sampleBattery,
    sampleBehaviour,
    defaultPreferences,
  );

  console.log("Intervention outcomes:");

  for (const outcome of outcomes) {
    console.log({
      action: outcome.action,
      energyBenefit: outcome.energyBenefit,
      uxQuality: outcome.uxQuality,
      preferenceFit: outcome.preferenceFit,
      utility: outcome.utility,
    });
  }

  const best = selectBestOutcome(
    sampleBattery,
    sampleBehaviour,
    defaultPreferences,
  );

  console.log("Best intervention:", best.action);

  console.log("Best utility:", best.utility);
}
