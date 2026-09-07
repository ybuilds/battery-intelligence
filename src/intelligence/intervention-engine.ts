import type { BatteryState } from "../types/battery";
import type { AppBehaviour } from "../types/behaviour";
import type { Intervention, InterventionAction } from "../types/intervention";
import type { UserEnergyPreferences } from "../types/preferences";

import { getPreferenceScore } from "./preference-engine";

export function selectIntervention(
  battery: BatteryState,
  behaviour: AppBehaviour,
  preferences?: UserEnergyPreferences,
): Intervention {
  /*
   * Battery pressure
   *
   * Higher value = greater need to conserve energy.
   */
  const batteryPressure =
    battery.level <= 15
      ? 1
      : battery.level <= 30
        ? 0.75
        : battery.level <= 50
          ? 0.4
          : 0.1;

  /*
   * Determine which resources the current application
   * depends on most heavily.
   */
  const resourceScores = {
    brightness: behaviour.screenDependency * batteryPressure,

    haptics:
      behaviour.interactionIntensity === "high"
        ? 0.8 * batteryPressure
        : 0.4 * batteryPressure,

    audio: behaviour.audioDependency * batteryPressure,

    background: behaviour.networkDependency * batteryPressure,
  };

  const preferenceScores = {
    reduce_brightness: preferences
      ? getPreferenceScore(preferences, "reduce_brightness")
      : 0.5,

    reduce_haptics: preferences
      ? getPreferenceScore(preferences, "reduce_haptics")
      : 0.5,

    reduce_audio: preferences
      ? getPreferenceScore(preferences, "reduce_audio")
      : 0.5,

    limit_background_activity: preferences
      ? getPreferenceScore(preferences, "limit_background_activity")
      : 0.5,
  };

  /*
   * We intentionally choose the intervention with the
   * highest potential battery benefit while trying to
   * minimize UX disruption.
   */
  const candidates: {
    action: InterventionAction;
    score: number;
    saving: number;
    uxImpact: number;
    reason: string;
  }[] = [
    {
      action: "reduce_brightness",
      score:
        resourceScores.brightness * 0.9 * preferenceScores.reduce_brightness,
      saving: 10,
      uxImpact: 0.25,
      reason: "The current application has high screen dependency.",
    },

    {
      action: "reduce_haptics",
      score: resourceScores.haptics * 0.6 * preferenceScores.reduce_haptics,
      saving: 3,
      uxImpact: 0.1,
      reason:
        "Interaction intensity is high, making haptic feedback a potential energy target.",
    },

    {
      action: "reduce_audio",
      score: resourceScores.audio * 0.5 * preferenceScores.reduce_audio,
      saving: 4,
      uxImpact: 0.2,
      reason: "The current application has significant audio dependency.",
    },

    {
      action: "limit_background_activity",
      score:
        resourceScores.background *
        0.4 *
        preferenceScores.limit_background_activity,
      saving: 6,
      uxImpact: 0.35,
      reason:
        "Network activity suggests potential background energy consumption.",
    },

    {
      action: "no_action",
      score: 0.15,
      saving: 0,
      uxImpact: 0,
      reason:
        "Current battery pressure does not justify a disruptive intervention.",
    },
  ];

  candidates.sort((a, b) => b.score - a.score);

  const selected = candidates[0];

  return {
    action: selected.action,
    estimatedBatterySaving: selected.saving,
    estimatedUXImpact: selected.uxImpact,
    confidence: Math.min(0.95, 0.5 + batteryPressure * 0.4),
    reason: selected.reason,
  };
}
