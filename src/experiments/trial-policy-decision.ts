import type { BaselineDecision } from "../baselines/baseline-types";
import type { EvaluationScenario } from "../evaluation/evaluation-types";
import type { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";
import type { ExperimentalTrial } from "../types/trial";

import { applyExperimentCondition, executePolicy } from "./policy-executor";

export function createTrialDecision(
  trial: ExperimentalTrial,
  scenario: EvaluationScenario,
  predictor: LightweightOutcomePredictor,
): BaselineDecision {
  const policyDecision = executePolicy(trial.system, scenario, predictor);

  return applyExperimentCondition(policyDecision, trial.condition);
}
