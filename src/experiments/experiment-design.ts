import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentCondition } from "../types/experiment";
import type { ExperimentalTrial } from "../types/trial";
import { createTrial } from "./trial-generator";

export type ExperimentDesign = {
  systems: BaselineSystem[];

  repetitionsPerSystem: number;

  targetDurationMinutes: number;

  minimumStartingBattery: number;
  maximumStartingBattery: number;

  applications: string[];

  includeControlTrials: boolean;

  randomizeTrialOrder: boolean;
};

export const DEFAULT_EXPERIMENT_DESIGN: ExperimentDesign = {
  systems: ["battery_only", "rule_based", "behaviour_aware", "personalized"],

  repetitionsPerSystem: 10,

  targetDurationMinutes: 20,

  minimumStartingBattery: 20,
  maximumStartingBattery: 50,

  applications: ["Instagram", "YouTube", "WhatsApp", "Spotify"],

  includeControlTrials: true,

  randomizeTrialOrder: true,
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function generateTrialMatrix(
  design: ExperimentDesign = DEFAULT_EXPERIMENT_DESIGN,
): ExperimentalTrial[] {
  const trials: ExperimentalTrial[] = [];

  for (const system of design.systems) {
    for (
      let repetition = 0;
      repetition < design.repetitionsPerSystem;
      repetition += 1
    ) {
      const application =
        design.applications[repetition % design.applications.length];

      const batteryRange =
        design.maximumStartingBattery - design.minimumStartingBattery;

      const startingBatteryLevel =
        design.minimumStartingBattery +
        Math.round(
          (batteryRange * repetition) /
            Math.max(1, design.repetitionsPerSystem - 1),
        );

      const conditions: ExperimentCondition[] = design.includeControlTrials
        ? ["control", "intervention"]
        : ["intervention"];

      for (const condition of conditions) {
        trials.push(
          createTrial(
            system,
            condition,
            application,
            startingBatteryLevel,
            design.targetDurationMinutes,
          ),
        );
      }
    }
  }

  return design.randomizeTrialOrder ? shuffle(trials) : trials;
}
