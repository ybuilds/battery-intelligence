import type { BatteryState } from "../types/battery";
import type { AppBehaviour, AppCategory } from "../types/behaviour";
import type { BehaviourProfile } from "../types/behaviour-profile";
import type { UserEnergyPreferences } from "../types/preferences";
import type { EvaluationScenario } from "./evaluation-types";

function createBattery(level: number): BatteryState {
  return {
    level,
    isCharging: false,
    lowPowerMode: level <= 20,
    estimatedMinutesRemaining: Math.max(0, level * 3),
  };
}

function createBehaviour(
  appName: string,
  category: AppCategory,
  overrides: Partial<AppBehaviour>,
): AppBehaviour {
  return {
    appName,
    category,
    sessionDurationMinutes: 20,
    interactionIntensity: "medium",
    screenDependency: 0.6,
    audioDependency: 0.2,
    networkDependency: 0.5,
    typicalSessionDurationMinutes: 20,
    preferredBrightness: 0.7,
    usageContext: "afternoon",
    ...overrides,
  };
}

function createPreferences(
  overrides: Partial<UserEnergyPreferences> = {},
): UserEnergyPreferences {
  return {
    reduce_brightness: {
      accepted: 0,
      rejected: 0,
    },
    reduce_haptics: {
      accepted: 0,
      rejected: 0,
    },
    reduce_audio: {
      accepted: 0,
      rejected: 0,
    },
    limit_background_activity: {
      accepted: 0,
      rejected: 0,
    },
    ...overrides,
  };
}

function createProfile(
  behaviour: AppBehaviour,
  observationCount: number,
): BehaviourProfile {
  return {
    appName: behaviour.appName,
    category: behaviour.category,
    observationCount,
    averageSessionDurationMinutes: behaviour.typicalSessionDurationMinutes,
    averageScreenDependency: behaviour.screenDependency,
    averageAudioDependency: behaviour.audioDependency,
    averageNetworkDependency: behaviour.networkDependency,
    averagePreferredBrightness: behaviour.preferredBrightness,
    dominantInteractionIntensity: behaviour.interactionIntensity,
    contextDistribution: {
      morning: 0.1,
      afternoon: 0.2,
      evening: 0.6,
      night: 0.1,
    },
    dominantContext: behaviour.usageContext,
    profileConfidence: observationCount / (observationCount + 10),
    firstObservedAt: "2026-01-01T00:00:00.000Z",
    lastObservedAt: "2026-09-01T00:00:00.000Z",
  };
}

export function generateEvaluationScenarios(): EvaluationScenario[] {
  const scenarios: EvaluationScenario[] = [];

  scenarios.push({
    scenarioId: "low-battery-social",
    description:
      "Low battery with a highly screen-dependent social application.",
    battery: createBattery(15),
    behaviour: createBehaviour("Instagram", "social", {
      sessionDurationMinutes: 25,
      typicalSessionDurationMinutes: 22,
      interactionIntensity: "high",
      screenDependency: 0.95,
      audioDependency: 0.2,
      networkDependency: 0.9,
      usageContext: "evening",
    }),
    preferences: createPreferences(),
    profile: null,
  });

  scenarios.push({
    scenarioId: "moderate-battery-video",
    description: "Moderate battery with a video workload.",
    battery: createBattery(35),
    behaviour: createBehaviour("YouTube", "video", {
      sessionDurationMinutes: 30,
      typicalSessionDurationMinutes: 28,
      interactionIntensity: "medium",
      screenDependency: 0.95,
      audioDependency: 0.85,
      networkDependency: 0.9,
      usageContext: "evening",
    }),
    preferences: createPreferences(),
    profile: null,
  });

  scenarios.push({
    scenarioId: "moderate-battery-audio",
    description: "Moderate battery with an audio-heavy workload.",
    battery: createBattery(30),
    behaviour: createBehaviour("Spotify", "music", {
      sessionDurationMinutes: 40,
      typicalSessionDurationMinutes: 35,
      interactionIntensity: "low",
      screenDependency: 0.2,
      audioDependency: 0.95,
      networkDependency: 0.8,
      usageContext: "morning",
    }),
    preferences: createPreferences(),
    profile: null,
  });

  scenarios.push({
    scenarioId: "higher-battery-productivity",
    description: "Higher battery with a productivity workload.",
    battery: createBattery(60),
    behaviour: createBehaviour("Notes", "productivity", {
      sessionDurationMinutes: 15,
      typicalSessionDurationMinutes: 18,
      interactionIntensity: "medium",
      screenDependency: 0.8,
      audioDependency: 0.05,
      networkDependency: 0.2,
      usageContext: "afternoon",
    }),
    preferences: createPreferences(),
    profile: null,
  });

  const personalizedBehaviour = createBehaviour("Instagram", "social", {
    sessionDurationMinutes: 18,
    typicalSessionDurationMinutes: 30,
    interactionIntensity: "high",
    screenDependency: 0.9,
    audioDependency: 0.15,
    networkDependency: 0.85,
    usageContext: "evening",
  });

  scenarios.push({
    scenarioId: "personalized-brightness-preference",
    description:
      "Low battery where historical behaviour and intervention preferences are available.",
    battery: createBattery(20),
    behaviour: personalizedBehaviour,
    preferences: createPreferences({
      reduce_brightness: {
        accepted: 8,
        rejected: 1,
      },
      reduce_haptics: {
        accepted: 1,
        rejected: 7,
      },
      reduce_audio: {
        accepted: 2,
        rejected: 5,
      },
      limit_background_activity: {
        accepted: 1,
        rejected: 3,
      },
    }),
    profile: createProfile(personalizedBehaviour, 50),
  });

  scenarios.push({
    scenarioId: "personalized-haptic-preference",
    description:
      "Low battery with a user who historically rejects brightness reduction but accepts haptic reduction.",
    battery: createBattery(18),
    behaviour: createBehaviour("WhatsApp", "communication", {
      sessionDurationMinutes: 12,
      typicalSessionDurationMinutes: 14,
      interactionIntensity: "high",
      screenDependency: 0.7,
      audioDependency: 0.1,
      networkDependency: 0.75,
      usageContext: "night",
    }),
    preferences: createPreferences({
      reduce_brightness: {
        accepted: 1,
        rejected: 8,
      },
      reduce_haptics: {
        accepted: 8,
        rejected: 1,
      },
      reduce_audio: {
        accepted: 1,
        rejected: 4,
      },
      limit_background_activity: {
        accepted: 2,
        rejected: 3,
      },
    }),
    profile: createProfile(
      createBehaviour("WhatsApp", "communication", {
        sessionDurationMinutes: 12,
        typicalSessionDurationMinutes: 14,
        interactionIntensity: "high",
        screenDependency: 0.7,
        audioDependency: 0.1,
        networkDependency: 0.75,
        usageContext: "night",
      }),
      40,
    ),
  });

  return scenarios;
}
