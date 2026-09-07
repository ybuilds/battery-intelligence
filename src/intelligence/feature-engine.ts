import type { BatteryState } from "../types/battery";

import type { AppBehaviour } from "../types/behaviour";

import type { UserEnergyPreferences } from "../types/preferences";

import type { BehaviourProfile } from "../types/behaviour-profile";

import { createPersonalizedBehaviour } from "./personalized-behaviour";

export type InterventionFeatures = {
  batteryLevel: number;

  batteryPressure: number;

  sessionDuration: number;

  typicalSessionDuration: number;

  sessionDurationRatio: number;

  sessionDeviation: number;

  screenDependency: number;

  audioDependency: number;

  networkDependency: number;

  interactionIntensity: number;

  preferredBrightness: number;

  contextMorning: number;

  contextAfternoon: number;

  contextEvening: number;

  contextNight: number;

  preferenceBrightness: number;

  preferenceHaptics: number;

  preferenceAudio: number;

  preferenceBackground: number;

  profileConfidence: number;

  profileObservationCount: number;
};

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function getBatteryPressure(batteryLevel: number): number {
  if (batteryLevel <= 15) {
    return 1;
  }

  if (batteryLevel <= 30) {
    return 0.75;
  }

  if (batteryLevel <= 50) {
    return 0.4;
  }

  return 0.1;
}

function getInteractionIntensityValue(
  intensity: AppBehaviour["interactionIntensity"],
): number {
  switch (intensity) {
    case "high":
      return 1;

    case "medium":
      return 0.5;

    case "low":
      return 0.25;
  }
}

function getPreferenceScore(
  preferences: UserEnergyPreferences,
  action:
    | "reduce_brightness"
    | "reduce_haptics"
    | "reduce_audio"
    | "limit_background_activity",
): number {
  const preference = preferences[action];

  const total = preference.accepted + preference.rejected;

  if (total === 0) {
    return 0.5;
  }

  return clamp(preference.accepted / total);
}

function getContextFeatures(context: AppBehaviour["usageContext"]) {
  return {
    contextMorning: context === "morning" ? 1 : 0,

    contextAfternoon: context === "afternoon" ? 1 : 0,

    contextEvening: context === "evening" ? 1 : 0,

    contextNight: context === "night" ? 1 : 0,
  };
}

function calculateSessionDeviation(
  currentDuration: number,
  typicalDuration: number,
): number {
  if (typicalDuration <= 0) {
    return 0;
  }

  return clamp(Math.abs(currentDuration - typicalDuration) / typicalDuration);
}

export function buildInterventionFeatures(
  battery: BatteryState,
  behaviour: AppBehaviour,
  preferences: UserEnergyPreferences,
  profile?: BehaviourProfile | null,
): InterventionFeatures {
  const personalizedBehaviour = createPersonalizedBehaviour(behaviour, profile);

  const typicalSessionDuration =
    personalizedBehaviour.typicalSessionDurationMinutes;

  const sessionDurationRatio =
    typicalSessionDuration > 0
      ? personalizedBehaviour.sessionDurationMinutes / typicalSessionDuration
      : 1;

  const sessionDeviation = calculateSessionDeviation(
    personalizedBehaviour.sessionDurationMinutes,

    typicalSessionDuration,
  );

  const context = getContextFeatures(personalizedBehaviour.usageContext);

  return {
    batteryLevel: clamp(battery.level / 100),

    batteryPressure: getBatteryPressure(battery.level),

    sessionDuration: clamp(personalizedBehaviour.sessionDurationMinutes / 60),

    typicalSessionDuration: clamp(typicalSessionDuration / 60),

    sessionDurationRatio: clamp(sessionDurationRatio / 3),

    sessionDeviation,

    screenDependency: clamp(personalizedBehaviour.screenDependency),

    audioDependency: clamp(personalizedBehaviour.audioDependency),

    networkDependency: clamp(personalizedBehaviour.networkDependency),

    interactionIntensity: getInteractionIntensityValue(
      personalizedBehaviour.interactionIntensity,
    ),

    preferredBrightness: clamp(personalizedBehaviour.preferredBrightness),

    ...context,

    preferenceBrightness: getPreferenceScore(preferences, "reduce_brightness"),

    preferenceHaptics: getPreferenceScore(preferences, "reduce_haptics"),

    preferenceAudio: getPreferenceScore(preferences, "reduce_audio"),

    preferenceBackground: getPreferenceScore(
      preferences,
      "limit_background_activity",
    ),

    profileConfidence: profile?.profileConfidence ?? 0,

    profileObservationCount: profile?.observationCount ?? 0,
  };
}

export function featuresToVector(features: InterventionFeatures): number[] {
  return [
    features.batteryLevel,

    features.batteryPressure,

    features.sessionDuration,

    features.typicalSessionDuration,

    features.sessionDurationRatio,

    features.sessionDeviation,

    features.screenDependency,

    features.audioDependency,

    features.networkDependency,

    features.interactionIntensity,

    features.preferredBrightness,

    features.contextMorning,

    features.contextAfternoon,

    features.contextEvening,

    features.contextNight,

    features.preferenceBrightness,

    features.preferenceHaptics,

    features.preferenceAudio,

    features.preferenceBackground,

    features.profileConfidence,

    clamp(features.profileObservationCount / 100),
  ];
}
