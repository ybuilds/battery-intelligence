import type { BehaviourProfile } from "../types/behaviour-profile";

import { calculatePersonalizationPolicy } from "./personalization-policy";

export type ColdStartPoint = {
  observationCount: number;

  profileConfidence: number;

  generalModelWeight: number;

  personalizedModelWeight: number;
};

function createProfile(observationCount: number): BehaviourProfile {
  const confidence = observationCount / (observationCount + 10);

  return {
    appName: "Cold Start",

    category: "utilities",

    observationCount,

    averageSessionDurationMinutes: 20,

    averageScreenDependency: 0.5,

    averageAudioDependency: 0.2,

    averageNetworkDependency: 0.5,

    averagePreferredBrightness: 0.5,

    dominantInteractionIntensity: "medium",

    contextDistribution: {
      morning: 0.25,
      afternoon: 0.25,
      evening: 0.25,
      night: 0.25,
    },

    dominantContext: "morning",

    profileConfidence: confidence,

    firstObservedAt: new Date().toISOString(),

    lastObservedAt: new Date().toISOString(),
  };
}

export function runColdStartAnalysis(
  observationCounts: number[],
): ColdStartPoint[] {
  return observationCounts.map((observationCount) => {
    const profile = createProfile(observationCount);

    const policy = calculatePersonalizationPolicy(profile);

    return {
      observationCount,

      profileConfidence: policy.confidence,

      generalModelWeight: policy.generalModelWeight,

      personalizedModelWeight: policy.personalizedModelWeight,
    };
  });
}
