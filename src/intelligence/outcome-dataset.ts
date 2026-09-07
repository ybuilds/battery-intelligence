import type { BatteryState } from "../types/battery";
import type { AppBehaviour } from "../types/behaviour";
import type { InterventionAction } from "../types/intervention";
import type { UserEnergyPreferences } from "../types/preferences";

import { generateBehaviourObservation } from "../data/behaviour-generator";

import { evaluateInterventionOutcome } from "./outcome-model";

export type OutcomeScenario = {
  battery: BatteryState;
  behaviour: AppBehaviour;
  preferences: UserEnergyPreferences;
  action: InterventionAction;
};

export type ObservedOutcome = {
  energySaving: number;
  uxImpact: number;
  userAcceptance: number;
};

export type OutcomeTrainingExample = {
  scenario: OutcomeScenario;
  expectedOutcome: ObservedOutcome;
};

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function randomNoise(magnitude: number): number {
  return Math.random() * 2 * magnitude - magnitude;
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
      accepted: Math.floor(Math.random() * 16),
      rejected: Math.floor(Math.random() * 16),
    },

    reduce_haptics: {
      accepted: Math.floor(Math.random() * 16),
      rejected: Math.floor(Math.random() * 16),
    },

    reduce_audio: {
      accepted: Math.floor(Math.random() * 16),
      rejected: Math.floor(Math.random() * 16),
    },

    limit_background_activity: {
      accepted: Math.floor(Math.random() * 16),
      rejected: Math.floor(Math.random() * 16),
    },
  };
}

function getPreferenceAcceptance(
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

function getActionEnergyFactor(action: InterventionAction): number {
  switch (action) {
    case "reduce_brightness":
      return 0.85;

    case "reduce_haptics":
      return 0.35;

    case "reduce_audio":
      return 0.45;

    case "limit_background_activity":
      return 0.65;

    case "no_action":
      return 0;
  }
}

function getActionUXFactor(action: InterventionAction): number {
  switch (action) {
    case "reduce_brightness":
      return 0.25;

    case "reduce_haptics":
      return 0.1;

    case "reduce_audio":
      return 0.2;

    case "limit_background_activity":
      return 0.3;

    case "no_action":
      return 0;
  }
}

function simulateObservedOutcome(scenario: OutcomeScenario): ObservedOutcome {
  const expected = evaluateInterventionOutcome(
    scenario.battery,
    scenario.behaviour,
    scenario.preferences,
    scenario.action,
  );

  const energyFactor = getActionEnergyFactor(scenario.action);

  const uxFactor = getActionUXFactor(scenario.action);

  const resourceIntensity =
    scenario.action === "reduce_brightness"
      ? scenario.behaviour.screenDependency
      : scenario.action === "reduce_audio"
        ? scenario.behaviour.audioDependency
        : scenario.action === "limit_background_activity"
          ? scenario.behaviour.networkDependency
          : scenario.action === "reduce_haptics"
            ? scenario.behaviour.interactionIntensity === "high"
              ? 1
              : scenario.behaviour.interactionIntensity === "medium"
                ? 0.5
                : 0.25
            : 0;

  const batteryFactor =
    scenario.battery.level <= 20
      ? 1
      : scenario.battery.level <= 40
        ? 0.75
        : 0.4;

  const energySaving = clamp(
    resourceIntensity * batteryFactor * energyFactor + randomNoise(0.06),
  );

  const uxImpact = clamp(resourceIntensity * uxFactor + randomNoise(0.04));

  const preferenceAcceptance = getPreferenceAcceptance(
    scenario.preferences,
    scenario.action,
  );

  const userAcceptance = clamp(
    preferenceAcceptance * (1 - uxImpact) + randomNoise(0.05),
  );

  return {
    energySaving,
    uxImpact,
    userAcceptance,
  };
}

function createScenario(): OutcomeScenario {
  const battery = createBatteryState();

  const behaviour = generateBehaviourObservation();

  const preferences = createPreferences();

  const actions: InterventionAction[] = [
    "reduce_brightness",
    "reduce_haptics",
    "reduce_audio",
    "limit_background_activity",
    "no_action",
  ];

  const action = actions[Math.floor(Math.random() * actions.length)];

  return {
    battery,
    behaviour,
    preferences,
    action,
  };
}

export function generateOutcomeDataset(
  count: number,
): OutcomeTrainingExample[] {
  return Array.from({ length: count }, () => {
    const scenario = createScenario();

    const expectedOutcome = simulateObservedOutcome(scenario);

    return {
      scenario,
      expectedOutcome,
    };
  });
}
