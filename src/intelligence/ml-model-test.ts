import { defaultPreferences } from "../data/default-preferences";
import { sampleBattery } from "../data/sample-battery";
import { sampleBehaviour } from "../data/sample-behaviour";

import { buildInterventionFeatures } from "./feature-engine";

import { generateOutcomeDataset } from "./outcome-dataset";

import { LightweightInterventionModel } from "./ml-model";

export function testLightweightModel() {
  const trainingDataset = generateOutcomeDataset(1000);

  const model = new LightweightInterventionModel();

  model.train(trainingDataset);

  const features = buildInterventionFeatures(
    sampleBattery,
    sampleBehaviour,
    defaultPreferences,
  );

  const prediction = model.predict(features);

  console.log("Training examples:", model.getTrainingSize());

  console.log("Predicted intervention:", prediction.action);

  console.log("Prediction confidence:", prediction.confidence);
}
