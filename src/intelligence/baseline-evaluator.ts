import type { BatteryState } from "../types/battery";
import type { AppBehaviour } from "../types/behaviour";
import type { InterventionAction } from "../types/intervention";
import type { UserEnergyPreferences } from "../types/preferences";

import { generateBehaviourObservation } from "../data/behaviour-generator";
import { defaultPreferences } from "../data/default-preferences";
import { selectIntervention } from "./intervention-engine";

export type EvaluationScenario = {
  battery: BatteryState;
  behaviour: AppBehaviour;
  preferences: UserEnergyPreferences;
};

export type EvaluationResult = {
  action: InterventionAction;
  energyScore: number;
  uxScore: number;
  preferenceScore: number;
  overallScore: number;
};

export type BaselineEvaluation = {
  scenarioCount: number;

  averageEnergyScore: number;
  averageUXScore: number;
  averagePreferenceScore: number;
  averageOverallScore: number;

  actionDistribution: Record<InterventionAction, number>;
};

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function createBatteryState(): BatteryState {
  const level = Math.floor(Math.random() * 91) + 10;

  return {
    level,
    isCharging: false,
    lowPowerMode: level <= 20,
    estimatedMinutesRemaining: level * 3,
  };
}

function createPreferences(): UserEnergyPreferences {
  return {
    reduce_brightness: {
      accepted: Math.floor(Math.random() * 10),
      rejected: Math.floor(Math.random() * 10),
    },

    reduce_haptics: {
      accepted: Math.floor(Math.random() * 10),
      rejected: Math.floor(Math.random() * 10),
    },

    reduce_audio: {
      accepted: Math.floor(Math.random() * 10),
      rejected: Math.floor(Math.random() * 10),
    },

    limit_background_activity: {
      accepted: Math.floor(Math.random() * 10),
      rejected: Math.floor(Math.random() * 10),
    },
  };
}

function calculatePreferenceScore(
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

  return preference.accepted / total;
}

function calculateEnergyScore(
  battery: BatteryState,
  behaviour: AppBehaviour,
  action: InterventionAction,
): number {
  const batteryPressure =
    battery.level <= 15
      ? 1
      : battery.level <= 30
        ? 0.75
        : battery.level <= 50
          ? 0.4
          : 0.1;

  let resourceRelevance = 0;

  switch (action) {
    case "reduce_brightness":
      resourceRelevance = behaviour.screenDependency;
      break;

    case "reduce_haptics":
      resourceRelevance =
        behaviour.interactionIntensity === "high"
          ? 1
          : behaviour.interactionIntensity === "medium"
            ? 0.5
            : 0.25;
      break;

    case "reduce_audio":
      resourceRelevance = behaviour.audioDependency;
      break;

    case "limit_background_activity":
      resourceRelevance = behaviour.networkDependency;
      break;

    case "no_action":
      resourceRelevance = 0;
      break;
  }

  return clamp(resourceRelevance * batteryPressure);
}

function calculateUXScore(
  behaviour: AppBehaviour,
  action: InterventionAction,
): number {
  if (action === "no_action") {
    return 1;
  }

  let impact = 0;

  switch (action) {
    case "reduce_brightness":
      impact = behaviour.screenDependency * 0.25;
      break;

    case "reduce_haptics":
      impact = behaviour.interactionIntensity === "high" ? 0.1 : 0.05;
      break;

    case "reduce_audio":
      impact = behaviour.audioDependency * 0.2;
      break;

    case "limit_background_activity":
      impact = behaviour.networkDependency * 0.3;
      break;
  }

  return clamp(1 - impact);
}

function evaluateScenario(scenario: EvaluationScenario): EvaluationResult {
  const intervention = selectIntervention(
    scenario.battery,
    scenario.behaviour,
    scenario.preferences,
  );

  const energyScore = calculateEnergyScore(
    scenario.battery,
    scenario.behaviour,
    intervention.action,
  );

  const uxScore = calculateUXScore(scenario.behaviour, intervention.action);

  const preferenceScore = calculatePreferenceScore(
    scenario.preferences,
    intervention.action,
  );

  const overallScore =
    energyScore * 0.45 + uxScore * 0.3 + preferenceScore * 0.25;

  return {
    action: intervention.action,
    energyScore,
    uxScore,
    preferenceScore,
    overallScore,
  };
}

export function evaluateBaseline(scenarioCount: number): BaselineEvaluation {
  const results: EvaluationResult[] = [];

  const actionDistribution: Record<InterventionAction, number> = {
    reduce_brightness: 0,
    reduce_haptics: 0,
    reduce_audio: 0,
    limit_background_activity: 0,
    no_action: 0,
  };

  for (let i = 0; i < scenarioCount; i += 1) {
    const scenario: EvaluationScenario = {
      battery: createBatteryState(),

      behaviour: generateBehaviourObservation(),

      preferences: {
        ...defaultPreferences,
        ...createPreferences(),
      },
    };

    const result = evaluateScenario(scenario);

    results.push(result);

    actionDistribution[result.action] += 1;
  }

  const count = results.length;

  if (count === 0) {
    return {
      scenarioCount: 0,
      averageEnergyScore: 0,
      averageUXScore: 0,
      averagePreferenceScore: 0,
      averageOverallScore: 0,
      actionDistribution,
    };
  }

  return {
    scenarioCount: count,

    averageEnergyScore:
      results.reduce((sum, result) => sum + result.energyScore, 0) / count,

    averageUXScore:
      results.reduce((sum, result) => sum + result.uxScore, 0) / count,

    averagePreferenceScore:
      results.reduce((sum, result) => sum + result.preferenceScore, 0) / count,

    averageOverallScore:
      results.reduce((sum, result) => sum + result.overallScore, 0) / count,

    actionDistribution,
  };
}
