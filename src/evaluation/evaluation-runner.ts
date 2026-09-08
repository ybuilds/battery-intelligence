import { runBaselineComparison } from "../baselines/baseline-runner";
import type { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";
import type {
    EvaluationScenario,
    ScenarioEvaluation,
} from "./evaluation-types";

export function runControlledEvaluation(
  scenarios: EvaluationScenario[],
  predictor: LightweightOutcomePredictor,
): ScenarioEvaluation[] {
  return scenarios.map((scenario) => ({
    scenario,
    decisions: runBaselineComparison(
      {
        battery: scenario.battery,
        behaviour: scenario.behaviour,
        preferences: scenario.preferences,
        profile: scenario.profile,
      },
      predictor,
    ),
  }));
}
