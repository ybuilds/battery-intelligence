import type { BaselineSystem } from "../baselines/baseline-types";
import type { EvaluationScenario } from "../evaluation/evaluation-types";
import type { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";
import type { ExperimentCondition } from "../types/experiment";
import type { ExperimentalTrial } from "../types/trial";
import { applyExperimentCondition, executePolicy } from "./policy-executor";
import type { TrialExecution } from "./trial-execution";
import { createTrial } from "./trial-generator";

export type PlannedTrial = {
  trial: ExperimentalTrial;
  scenario: EvaluationScenario;
};

export function planTrial(
  system: BaselineSystem,
  condition: ExperimentCondition,
  scenario: EvaluationScenario,
  repetition: number,
): PlannedTrial {
  const trial = createTrial(
    system,
    condition,
    scenario.behaviour.appName,
    scenario.battery.level,
    20,
    {
      block: repetition,
      repetition,
      randomizedOrder: 0,
    },
  );

  return {
    trial,
    scenario,
  };
}

export function executePlannedTrial(
  plannedTrial: PlannedTrial,
  predictor: LightweightOutcomePredictor,
): TrialExecution {
  const startedAt = new Date().toISOString();

  const policyDecision = executePolicy(
    plannedTrial.trial.system,
    plannedTrial.scenario,
    predictor,
  );

  const decision = applyExperimentCondition(
    policyDecision,
    plannedTrial.trial.condition,
  );

  return {
    trialId: plannedTrial.trial.trialId,

    system: plannedTrial.trial.system,

    condition: plannedTrial.trial.condition,

    scenarioId: plannedTrial.scenario.scenarioId,

    decision,

    startedAt,

    status: "running",
  };
}

export function completeTrial(execution: TrialExecution): TrialExecution {
  return {
    ...execution,

    completedAt: new Date().toISOString(),

    status: "completed",
  };
}
