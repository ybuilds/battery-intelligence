import type { AppBehaviour } from "../types/behaviour";

import type { BehaviourProfile } from "../types/behaviour-profile";

export function profileToBehaviour(
  profile: BehaviourProfile,
  currentSessionDurationMinutes: number,
): AppBehaviour {
  return {
    appName: profile.appName,

    category: profile.category,

    sessionDurationMinutes: currentSessionDurationMinutes,

    interactionIntensity: profile.dominantInteractionIntensity,

    screenDependency: profile.averageScreenDependency,

    audioDependency: profile.averageAudioDependency,

    networkDependency: profile.averageNetworkDependency,

    typicalSessionDurationMinutes: profile.averageSessionDurationMinutes,

    preferredBrightness: profile.averagePreferredBrightness,

    usageContext: profile.dominantContext,
  };
}
