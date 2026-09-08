import type {
  BaselineDecision,
  BaselineSystem,
} from "../baselines/baseline-types";
import { batteryOnlyBaseline } from "../baselines/battery-only";
import { behaviourAwareBaseline } from "../baselines/behaviour-aware";
import { ruleBasedBaseline } from "../baselines/rule-based";
import type { EvaluationScenario } from "../evaluation/evaluation-types";
import type { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";
import { generateRecommendation } from "../intelligence/recommendation-engine";
import type { ExperimentCondition } from "../types/experiment";

export function executePolicy(
  system: BaselineSystem,
  scenario: EvaluationScenario,
  predictor: LightweightOutcomePredictor,
): BaselineDecision {
  switch (system) {
    case "battery_only":
      return batteryOnlyBaseline(scenario.battery);

    case "rule_based":
      return ruleBasedBaseline(scenario.battery, scenario.behaviour);

    case "behaviour_aware":
      return behaviourAwareBaseline(
        scenario.battery,
        scenario.behaviour,
        predictor,
      );

    case "personalized": {
      const recommendation = generateRecommendation(
        scenario.battery,
        scenario.behaviour,
        scenario.preferences,
        predictor,
        scenario.profile,
      );

      const selected = recommendation.candidates.find(
        (candidate) => candidate.action === recommendation.selectedAction,
      );

      return {
        system: "personalized",
        selectedAction: recommendation.selectedAction,
        score: selected?.utilityScore ?? 0,
        estimatedEnergySaving: selected?.predictedEnergySaving ?? 0,
        estimatedUXImpact: selected?.predictedUXImpact ?? 0,
        reason: recommendation.explanation,
      };
    }
  }
}

export function applyExperimentCondition(
  decision: BaselineDecision,
  condition: ExperimentCondition,
): BaselineDecision {
  if (condition === "intervention") {
    return decision;
  }

  return {
    ...decision,

    selectedAction: "no_action",

    estimatedEnergySaving: 0,

    estimatedUXImpact: 0,

    reason: "Control condition: no intervention is applied.",
  };
}
