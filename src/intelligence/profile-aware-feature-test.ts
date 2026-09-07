import { sampleBattery } from "../data/sample-battery";

import { sampleBehaviour } from "../data/sample-behaviour";

import { defaultPreferences } from "../data/default-preferences";

import type { BehaviourProfile } from "../types/behaviour-profile";

import { buildInterventionFeatures, featuresToVector } from "./feature-engine";

export function testProfileAwareFeatures() {
  const profile: BehaviourProfile = {
    appName: "Instagram",

    category: "social",

    observationCount: 40,

    averageSessionDurationMinutes: 22,

    averageScreenDependency: 0.91,

    averageAudioDependency: 0.2,

    averageNetworkDependency: 0.86,

    averagePreferredBrightness: 0.75,

    dominantInteractionIntensity: "high",

    contextDistribution: {
      morning: 0.1,
      afternoon: 0.15,
      evening: 0.6,
      night: 0.15,
    },

    dominantContext: "evening",

    profileConfidence: 40 / 50,

    firstObservedAt: new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 30,
    ).toISOString(),

    lastObservedAt: new Date().toISOString(),
  };

  const currentBehaviour = {
    ...sampleBehaviour,

    appName: "Instagram",

    sessionDurationMinutes: 44,
  };

  const features = buildInterventionFeatures(
    sampleBattery,
    currentBehaviour,
    defaultPreferences,
    profile,
  );

  const vector = featuresToVector(features);

  console.log("Profile-aware features:");

  console.log(features);

  console.log("Feature vector length:", vector.length);

  console.log("Session duration ratio:", features.sessionDurationRatio);

  console.log("Session deviation:", features.sessionDeviation);

  console.log("Profile confidence:", features.profileConfidence);
}
