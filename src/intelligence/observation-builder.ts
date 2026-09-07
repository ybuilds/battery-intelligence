import type {
    AppBehaviour,
    AppCategory,
    InteractionIntensity,
    UsageContext,
} from "../types/behaviour";

import type { BatteryState } from "../types/battery";

import type { SessionInteractionState } from "../types/observation";

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function getInteractionIntensity(
  interactionCount: number,
  durationMinutes: number,
): InteractionIntensity {
  if (durationMinutes <= 0) {
    return "low";
  }

  const interactionsPerMinute = interactionCount / durationMinutes;

  if (interactionsPerMinute >= 8) {
    return "high";
  }

  if (interactionsPerMinute >= 3) {
    return "medium";
  }

  return "low";
}

function getUsageContext(date = new Date()): UsageContext {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 22) {
    return "evening";
  }

  return "night";
}

export function buildBehaviourObservation(
  battery: BatteryState,
  interaction: SessionInteractionState,
  appName: string,
  category: AppCategory,
): AppBehaviour {
  const durationMinutes = Math.max(0.1, interaction.activeDurationSeconds / 60);

  const interactionIntensity = getInteractionIntensity(
    interaction.interactionCount,
    durationMinutes,
  );

  /*
   * These dependency estimates are intentionally
   * derived from observable application behaviour.
   *
   * They are not presented as direct measurements
   * of system-level energy consumption.
   */

  const screenDependency = clamp(Math.min(1, durationMinutes / 30));

  const audioDependency = interaction.audioUsed ? 1 : 0;

  const networkDependency = interaction.networkUsed ? 1 : 0;

  /*
   * For the first real-device observation,
   * the current session duration becomes the
   * initial estimate of typical duration.
   *
   * Later phases will replace this with the
   * user's historical distribution.
   */

  const typicalSessionDurationMinutes = durationMinutes;

  /*
   * React Native does not directly expose
   * an unrestricted global iOS brightness
   * value through this observation layer.
   *
   * Therefore this remains a neutral initial
   * estimate until a supported measurement
   * mechanism is added.
   */

  const preferredBrightness = 0.5;

  return {
    appName,

    category,

    sessionDurationMinutes: durationMinutes,

    interactionIntensity,

    screenDependency,

    audioDependency,

    networkDependency,

    typicalSessionDurationMinutes,

    preferredBrightness,

    usageContext: getUsageContext(),
  };
}
