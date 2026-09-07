import type { BatteryState } from "../types/battery";
import type { AppBehaviour } from "../types/behaviour";
import type { InterventionAction } from "../types/intervention";
import type { UserEnergyPreferences } from "../types/preferences";

import {
    evaluateCandidateActions,
    type DecisionWeights,
} from "./decision-model";

import { generateBehaviourObservation } from "../data/behaviour-generator";

type Scenario = {
  battery: BatteryState;
  behaviour: AppBehaviour;
  preferences: UserEnergyPreferences;
};

export type SensitivityConfiguration = {
  name: string;
  weights: DecisionWeights;
};

export type SensitivityResult = {
  configuration: string;

  scenarioCount: number;

  averageOverallScore: number;

  actionDistribution: Record<InterventionAction, number>;
};

const configurations: SensitivityConfiguration[] = [
  {
    name: "energy_first",
    weights: {
      energy: 0.7,
      ux: 0.2,
      preference: 0.1,
    },
  },

  {
    name: "balanced",
    weights: {
      energy: 0.45,
      ux: 0.3,
      preference: 0.25,
    },
  },

  {
    name: "user_first",
    weights: {
      energy: 0.25,
      ux: 0.25,
      preference: 0.5,
    },
  },
];

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
      accepted: Math.floor(Math.random() * 11),
      rejected: Math.floor(Math.random() * 11),
    },

    reduce_haptics: {
      accepted: Math.floor(Math.random() * 11),
      rejected: Math.floor(Math.random() * 11),
    },

    reduce_audio: {
      accepted: Math.floor(Math.random() * 11),
      rejected: Math.floor(Math.random() * 11),
    },

    limit_background_activity: {
      accepted: Math.floor(Math.random() * 11),
      rejected: Math.floor(Math.random() * 11),
    },
  };
}

function createScenario(): Scenario {
  return {
    battery: createBatteryState(),

    behaviour: generateBehaviourObservation(),

    preferences: createPreferences(),
  };
}

function createActionDistribution(): Record<InterventionAction, number> {
  return {
    reduce_brightness: 0,
    reduce_haptics: 0,
    reduce_audio: 0,
    limit_background_activity: 0,
    no_action: 0,
  };
}

export function generateScenarios(count: number): Scenario[] {
  return Array.from({ length: count }, createScenario);
}

export function runSensitivityAnalysis(
  scenarios: Scenario[],
): SensitivityResult[] {
  return configurations.map((configuration) => {
    const actionDistribution = createActionDistribution();

    let totalScore = 0;

    for (const scenario of scenarios) {
      const candidates = evaluateCandidateActions(
        scenario.battery,
        scenario.behaviour,
        scenario.preferences,
        configuration.weights,
      );

      const best = candidates.reduce((currentBest, candidate) =>
        candidate.overallScore > currentBest.overallScore
          ? candidate
          : currentBest,
      );

      actionDistribution[best.action] += 1;

      totalScore += best.overallScore;
    }

    const scenarioCount = scenarios.length;

    return {
      configuration: configuration.name,

      scenarioCount,

      averageOverallScore: scenarioCount === 0 ? 0 : totalScore / scenarioCount,

      actionDistribution,
    };
  });
}

export function runDefaultSensitivityAnalysis(
  scenarioCount = 1000,
): SensitivityResult[] {
  const scenarios = generateScenarios(scenarioCount);

  return runSensitivityAnalysis(scenarios);
}
