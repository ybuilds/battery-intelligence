import { defaultPreferences } from "../data/default-preferences";
import { sampleBattery } from "../data/sample-battery";
import { sampleBehaviour } from "../data/sample-behaviour";

import { generateOutcomeDataset } from "../intelligence/outcome-dataset";

import { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";

import { runBaselineComparison } from "./baseline-runner";

export function testBaselineComparison(): void {
  const dataset = generateOutcomeDataset(1000);

  const predictor = new LightweightOutcomePredictor();

  predictor.train(dataset);

  const results = runBaselineComparison(
    {
      battery: sampleBattery,
      behaviour: sampleBehaviour,
      preferences: defaultPreferences,
      profile: null,
    },
    predictor,
  );

  console.log("=== BASELINE COMPARISON ===");

  for (const result of results) {
    console.log({
      system: result.system,
      selectedAction: result.selectedAction,
      score: result.score,
      estimatedEnergySaving: result.estimatedEnergySaving,
      estimatedUXImpact: result.estimatedUXImpact,
    });
  }
}
