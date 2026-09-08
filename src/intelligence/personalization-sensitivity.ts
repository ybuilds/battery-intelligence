import type { BehaviourProfile } from "../types/behaviour-profile";

import {
    blendPersonalizedValue,
    calculatePersonalizationPolicy,
} from "./personalization-policy";

export type PersonalizationSensitivityPoint = {
  observationCount: number;
  profileConfidence: number;
  generalModelWeight: number;
  personalizedModelWeight: number;
  generalValue: number;
  personalizedValue: number;
  blendedValue: number;
  personalizationShift: number;
};

export type PersonalizationSensitivityAnalysis = {
  points: PersonalizationSensitivityPoint[];
  monotonicConfidence: boolean;
  finalPersonalizedWeight: number;
  initialPersonalizedWeight: number;
};

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function createSyntheticProfile(observationCount: number): BehaviourProfile {
  const confidence = observationCount / (observationCount + 10);

  return {
    appName: "SensitivityTestApp",

    category: "social",

    observationCount,

    averageSessionDurationMinutes: 25,

    averageScreenDependency: 0.9,

    averageAudioDependency: 0.2,

    averageNetworkDependency: 0.8,

    averagePreferredBrightness: 0.4,

    dominantInteractionIntensity: "high",

    contextDistribution: {
      morning: 0.1,
      afternoon: 0.2,
      evening: 0.5,
      night: 0.2,
    },

    dominantContext: "evening",

    profileConfidence: confidence,

    firstObservedAt: new Date(Date.now() - 86400000).toISOString(),

    lastObservedAt: new Date().toISOString(),
  };
}

/**
 * Runs a controlled sensitivity analysis showing
 * how the personalization policy changes as
 * behavioural evidence accumulates.
 *
 * The values below intentionally represent two
 * different estimates:
 *
 * generalValue:
 *   value produced by the general model
 *
 * personalizedValue:
 *   value produced by the personalized profile
 *
 * The analysis then verifies that the blended
 * value increasingly approaches the personalized
 * estimate as observation count increases.
 */
export function runPersonalizationSensitivityAnalysis(
  observationCounts: number[] = [0, 1, 5, 10, 25, 50, 100],
): PersonalizationSensitivityAnalysis {
  const generalValue = 0.3;
  const personalizedValue = 0.8;

  const points = observationCounts.map((observationCount) => {
    const profile =
      observationCount === 0 ? null : createSyntheticProfile(observationCount);

    const policy = calculatePersonalizationPolicy(profile);

    const blendedValue = blendPersonalizedValue(
      generalValue,
      personalizedValue,
      policy,
    );

    const personalizationShift = Math.abs(blendedValue - generalValue);

    return {
      observationCount,

      profileConfidence: policy.confidence,

      generalModelWeight: policy.generalModelWeight,

      personalizedModelWeight: policy.personalizedModelWeight,

      generalValue,

      personalizedValue,

      blendedValue,

      personalizationShift,
    };
  });

  let monotonicConfidence = true;

  for (let index = 1; index < points.length; index += 1) {
    if (
      points[index].personalizedModelWeight <
      points[index - 1].personalizedModelWeight
    ) {
      monotonicConfidence = false;
      break;
    }
  }

  return {
    points,

    monotonicConfidence,

    finalPersonalizedWeight:
      points.length > 0 ? points[points.length - 1].personalizedModelWeight : 0,

    initialPersonalizedWeight:
      points.length > 0 ? points[0].personalizedModelWeight : 0,
  };
}

/**
 * Convenience function for testing the behaviour
 * of the personalization policy.
 */
export function printPersonalizationSensitivityAnalysis(): void {
  const analysis = runPersonalizationSensitivityAnalysis();

  console.log("=== Personalization Sensitivity Analysis ===");

  for (const point of analysis.points) {
    console.log({
      observations: point.observationCount,

      confidence: Number(point.profileConfidence.toFixed(4)),

      generalWeight: Number(point.generalModelWeight.toFixed(4)),

      personalizedWeight: Number(point.personalizedModelWeight.toFixed(4)),

      blendedValue: Number(point.blendedValue.toFixed(4)),

      personalizationShift: Number(point.personalizationShift.toFixed(4)),
    });
  }

  console.log("Monotonic personalization:", analysis.monotonicConfidence);
}
