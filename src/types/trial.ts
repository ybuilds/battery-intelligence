import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentCondition } from "./experiment";

export type TrialAllocation = {
  block: number;

  repetition: number;

  randomizedOrder: number;
};

export type ExperimentalTrial = {
  trialId: string;

  system: BaselineSystem;

  condition: ExperimentCondition;

  appName: string;

  startingBatteryLevel: number;

  targetDurationMinutes: number;

  status: "planned" | "running" | "completed" | "cancelled";

  allocation: TrialAllocation;

  startedAt?: string;

  completedAt?: string;
};
