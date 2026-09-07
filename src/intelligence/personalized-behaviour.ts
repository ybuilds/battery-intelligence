import type { AppBehaviour } from "../types/behaviour";

import type { BehaviourProfile } from "../types/behaviour-profile";

import {
    blendPersonalizedValue,
    calculatePersonalizationPolicy,
} from "./personalization-policy";

export function createPersonalizedBehaviour(
  currentBehaviour: AppBehaviour,
  profile?: BehaviourProfile | null,
): AppBehaviour {
  if (!profile) {
    return {
      ...currentBehaviour,
    };
  }

  const policy = calculatePersonalizationPolicy(profile);

  return {
    ...currentBehaviour,

    typicalSessionDurationMinutes: blendPersonalizedValue(
      currentBehaviour.typicalSessionDurationMinutes,

      profile.averageSessionDurationMinutes,

      policy,
    ),

    screenDependency: blendPersonalizedValue(
      currentBehaviour.screenDependency,

      profile.averageScreenDependency,

      policy,
    ),

    audioDependency: blendPersonalizedValue(
      currentBehaviour.audioDependency,

      profile.averageAudioDependency,

      policy,
    ),

    networkDependency: blendPersonalizedValue(
      currentBehaviour.networkDependency,

      profile.averageNetworkDependency,

      policy,
    ),

    preferredBrightness: blendPersonalizedValue(
      currentBehaviour.preferredBrightness,

      profile.averagePreferredBrightness,

      policy,
    ),
  };
}
