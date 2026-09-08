import type { BaselineDecision, BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentCondition } from "../types/experiment";

export type TrialExecution = {
  trialId: string;

  system: BaselineSystem;
  condition: ExperimentCondition;

  scenarioId: string;

  decision: BaselineDecision;

  startedAt: string;
  completedAt?: string;

  status: "planned" | "running" | "completed" | "cancelled";
};
