import type { BaselineDecision, BaselineScenario } from "./baseline-types";

import { batteryOnlyBaseline } from "./battery-only";

import { ruleBasedBaseline } from "./rule-based";

import { behaviourAwareBaseline } from "./behaviour-aware";

import { generateRecommendation } from "../intelligence/recommendation-engine";

import { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";

export function runBaselineComparison(
  scenario: BaselineScenario,
  predictor: LightweightOutcomePredictor,
): BaselineDecision[] {
  const batteryOnly = batteryOnlyBaseline(scenario.battery);

  const ruleBased = ruleBasedBaseline(scenario.battery, scenario.behaviour);

  const behaviourAware = behaviourAwareBaseline(
    scenario.battery,
    scenario.behaviour,
    predictor,
  );

  const personalized = generateRecommendation(
    scenario.battery,
    scenario.behaviour,
    scenario.preferences,
    predictor,
    scenario.profile,
  );

  const selected = personalized.candidates[0];

  const personalizedDecision: BaselineDecision = {
    system: "personalized",
    selectedAction: personalized.selectedAction,
    score: selected?.utilityScore ?? 0,
    estimatedEnergySaving: selected?.predictedEnergySaving ?? 0,
    estimatedUXImpact: selected?.predictedUXImpact ?? 0,
    reason: personalized.explanation,
  };

  return [batteryOnly, ruleBased, behaviourAware, personalizedDecision];
}
