import type { BehaviourProfile } from "../types/behaviour-profile";

export type PersonalizationPolicy = {
  generalModelWeight: number;
  personalizedModelWeight: number;
  confidence: number;
};

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function calculatePersonalizationPolicy(
  profile?: BehaviourProfile | null,
): PersonalizationPolicy {
  if (!profile) {
    return {
      generalModelWeight: 1,
      personalizedModelWeight: 0,
      confidence: 0,
    };
  }

  const confidence = clamp(profile.profileConfidence);

  return {
    generalModelWeight: 1 - confidence,

    personalizedModelWeight: confidence,

    confidence,
  };
}

export function blendPersonalizedValue(
  generalValue: number,
  personalizedValue: number,
  policy: PersonalizationPolicy,
): number {
  return (
    generalValue * policy.generalModelWeight +
    personalizedValue * policy.personalizedModelWeight
  );
}
