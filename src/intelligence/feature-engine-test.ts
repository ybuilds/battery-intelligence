import { sampleBattery } from "../data/sample-battery";

import { sampleBehaviour } from "../data/sample-behaviour";

import { defaultPreferences } from "../data/default-preferences";

import { buildInterventionFeatures, featuresToVector } from "./feature-engine";

export function testFeatureEngine() {
  const features = buildInterventionFeatures(
    sampleBattery,
    sampleBehaviour,
    defaultPreferences,
  );

  const vector = featuresToVector(features);

  console.log("Generated intervention features:");

  console.log(features);

  console.log("Feature vector length:", vector.length);

  console.log("Feature vector:", vector);
}
