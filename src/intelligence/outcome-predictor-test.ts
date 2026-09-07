import { generateOutcomeDataset } from "./outcome-dataset";

import { LightweightOutcomePredictor } from "./outcome-predictor";

import { defaultPreferences } from "../data/default-preferences";
import { sampleBattery } from "../data/sample-battery";
import { sampleBehaviour } from "../data/sample-behaviour";

export function testOutcomePredictor() {
  const dataset = generateOutcomeDataset(2000);

  const model = new LightweightOutcomePredictor();

  model.train(dataset);

  console.log("Outcome predictor training size:", model.getTrainingSize());

  const predictions = model.predictAll(
    sampleBattery,
    sampleBehaviour,
    defaultPreferences,
  );

  console.log("Predicted intervention outcomes:");

  for (const prediction of predictions) {
    console.log({
      action: prediction.action,
      energySaving: prediction.energySaving,
      uxImpact: prediction.uxImpact,
      userAcceptance: prediction.userAcceptance,
      confidence: prediction.confidence,
    });
  }
}
