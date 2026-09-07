import type { BatteryState } from "../types/battery";
import type { AppBehaviour } from "../types/behaviour";
import type { InterventionAction } from "../types/intervention";
import type { UserEnergyPreferences } from "../types/preferences";

export type DecisionWeights = {
  energy: number;
  ux: number;
  preference: number;
};

export type CandidateEvaluation = {
  action: InterventionAction;

  energyBenefit: number;
  uxQuality: number;
  preferenceFit: number;

  overallScore: number;
};

export const defaultDecisionWeights: DecisionWeights = {
  energy: 0.45,
  ux: 0.3,
  preference: 0.25,
};

const actions: InterventionAction[] = [
  "reduce_brightness",
  "reduce_haptics",
  "reduce_audio",
  "limit_background_activity",
  "no_action",
];

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

function getPreferenceFit(
  preferences: UserEnergyPreferences,
  action: InterventionAction,
): number {
  if (action === "no_action") {
    return 1;
  }

  const preference = preferences[action];

  const total = preference.accepted + preference.rejected;

  if (total === 0) {
    return 0.5;
  }

  return clamp(preference.accepted / total);
}

function calculateEnergyBenefit(
  battery: BatteryState,
  behaviour: AppBehaviour,
  action: InterventionAction,
): number {
  const batteryPressure = getBatteryPressure(battery.level);

  let relevance = 0;

  switch (action) {
    case "reduce_brightness":
      relevance = behaviour.screenDependency;
      break;

    case "reduce_haptics":
      relevance =
        behaviour.interactionIntensity === "high"
          ? 1
          : behaviour.interactionIntensity === "medium"
            ? 0.5
            : 0.25;
      break;

    case "reduce_audio":
      relevance = behaviour.audioDependency;
      break;

    case "limit_background_activity":
      relevance = behaviour.networkDependency;
      break;

    case "no_action":
      return 0;
  }

  return clamp(relevance * batteryPressure);
}

function calculateUXQuality(
  behaviour: AppBehaviour,
  action: InterventionAction,
): number {
  let disruption = 0;

  switch (action) {
    case "reduce_brightness":
      disruption = behaviour.screenDependency * 0.25;
      break;

    case "reduce_haptics":
      disruption = behaviour.interactionIntensity === "high" ? 0.1 : 0.05;
      break;

    case "reduce_audio":
      disruption = behaviour.audioDependency * 0.2;
      break;

    case "limit_background_activity":
      disruption = behaviour.networkDependency * 0.3;
      break;

    case "no_action":
      return 1;
  }

  return clamp(1 - disruption);
}

export function evaluateCandidateActions(
  battery: BatteryState,
  behaviour: AppBehaviour,
  preferences: UserEnergyPreferences,
  weights: DecisionWeights = defaultDecisionWeights,
): CandidateEvaluation[] {
  return actions.map((action) => {
    const energyBenefit = calculateEnergyBenefit(battery, behaviour, action);

    const uxQuality = calculateUXQuality(behaviour, action);

    const preferenceFit = getPreferenceFit(preferences, action);

    const overallScore =
      energyBenefit * weights.energy +
      uxQuality * weights.ux +
      preferenceFit * weights.preference;

    return {
      action,
      energyBenefit,
      uxQuality,
      preferenceFit,
      overallScore,
    };
  });
}

export function selectBestAction(
  battery: BatteryState,
  behaviour: AppBehaviour,
  preferences: UserEnergyPreferences,
  weights: DecisionWeights = defaultDecisionWeights,
): CandidateEvaluation {
  const candidates = evaluateCandidateActions(
    battery,
    behaviour,
    preferences,
    weights,
  );

  candidates.sort((a, b) => b.overallScore - a.overallScore);

  return candidates[0];
}
