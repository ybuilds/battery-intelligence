import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentCondition } from "../types/experiment";

export type ExperimentalRecord = {
  trialId: string;

  system: BaselineSystem;
  condition: ExperimentCondition;

  appName: string;

  batteryBefore: number;
  batteryAfter: number;

  durationMinutes: number;

  batteryDelta: number;
  batteryDrainRate: number;

  uxImpact?: number;
  userAcceptance?: 0 | 1;

  recordedAt: string;

  block: number;
  repetition: number;
};
