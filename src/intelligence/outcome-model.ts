import type { BatteryState } from "../types/battery";
import type { AppBehaviour } from "../types/behaviour";
import type { InterventionAction } from "../types/intervention";
import type { UserEnergyPreferences } from "../types/preferences";

export type InterventionOutcome = {
  action: InterventionAction;

  energyBenefit: number;
  uxQuality: number;
  preferenceFit: number;

  utility: number;
};

export type OutcomeWeights = {
  energy: number;
  ux: number;
  preference: number;
};

export const defaultOutcomeWeights: OutcomeWeights = {
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

function getResourceRelevance(
  behaviour: AppBehaviour,
  action: InterventionAction,
): number {
  switch (action) {
    case "reduce_brightness":
      return behaviour.screenDependency;

    case "reduce_haptics":
      return behaviour.interactionIntensity === "high"
        ? 1
        : behaviour.interactionIntensity === "medium"
          ? 0.5
          : 0.25;

    case "reduce_audio":
      return behaviour.audioDependency;

    case "limit_background_activity":
      return behaviour.networkDependency;

    case "no_action":
      return 0;
  }
}

function calculateEnergyBenefit(
  battery: BatteryState,
  behaviour: AppBehaviour,
  action: InterventionAction,
): number {
  if (action === "no_action") {
    return 0;
  }

  const batteryPressure = getBatteryPressure(battery.level);

  const resourceRelevance = getResourceRelevance(behaviour, action);

  return clamp(resourceRelevance * batteryPressure);
}

function calculateUXQuality(
  behaviour: AppBehaviour,
  action: InterventionAction,
): number {
  switch (action) {
    case "reduce_brightness":
      return clamp(1 - behaviour.screenDependency * 0.25);

    case "reduce_haptics":
      return clamp(
        1 - (behaviour.interactionIntensity === "high" ? 0.1 : 0.05),
      );

    case "reduce_audio":
      return clamp(1 - behaviour.audioDependency * 0.2);

    case "limit_background_activity":
      return clamp(1 - behaviour.networkDependency * 0.3);

    case "no_action":
      return 1;
  }
}

export function evaluateInterventionOutcome(
  battery: BatteryState,
  behaviour: AppBehaviour,
  preferences: UserEnergyPreferences,
  action: InterventionAction,
  weights: OutcomeWeights = defaultOutcomeWeights,
): InterventionOutcome {
  const energyBenefit = calculateEnergyBenefit(battery, behaviour, action);

  const uxQuality = calculateUXQuality(behaviour, action);

  const preferenceFit = getPreferenceFit(preferences, action);

  const utility =
    energyBenefit * weights.energy +
    uxQuality * weights.ux +
    preferenceFit * weights.preference;

  return {
    action,
    energyBenefit,
    uxQuality,
    preferenceFit,
    utility,
  };
}

export function evaluateAllInterventions(
  battery: BatteryState,
  behaviour: AppBehaviour,
  preferences: UserEnergyPreferences,
  weights: OutcomeWeights = defaultOutcomeWeights,
): InterventionOutcome[] {
  return actions.map((action) =>
    evaluateInterventionOutcome(
      battery,
      behaviour,
      preferences,
      action,
      weights,
    ),
  );
}

export function selectBestOutcome(
  battery: BatteryState,
  behaviour: AppBehaviour,
  preferences: UserEnergyPreferences,
  weights: OutcomeWeights = defaultOutcomeWeights,
): InterventionOutcome {
  const outcomes = evaluateAllInterventions(
    battery,
    behaviour,
    preferences,
    weights,
  );

  return outcomes.reduce((best, current) =>
    current.utility > best.utility ? current : best,
  );
}
