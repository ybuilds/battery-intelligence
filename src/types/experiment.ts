import type { BaselineSystem } from "../baselines/baseline-types";

export type ExperimentCondition = "control" | "intervention";

export type ExperimentDecision =
  | "accepted"
  | "rejected"
  | "ignored"
  | "pending";

export type ExperimentSession = {
  sessionId: string;

  trialId: string;

  system: BaselineSystem;

  startedAt: string;

  appName: string;

  batteryLevelAtStart: number;

  selectedAction: string;

  condition: ExperimentCondition;

  userDecision: ExperimentDecision;

  completedAt?: string;
};

export type InterventionOutcomeMeasurement = {
  sessionId: string;

  batteryLevelBefore: number;

  batteryLevelAfter?: number;

  energySaving?: number;

  uxImpact?: number;

  userAcceptance: 0 | 1 | undefined;

  measuredDurationMinutes?: number;

  recordedAt: string;
};
