import { generateOutcomeDataset } from "../intelligence/outcome-dataset";
import { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";
import { calculateEvaluationSummary } from "./evaluation-metrics";
import { runControlledEvaluation } from "./evaluation-runner";
import { generateEvaluationScenarios } from "./evaluation-scenarios";

export function testControlledEvaluation(): void {
  const dataset = generateOutcomeDataset(2000);

  const predictor = new LightweightOutcomePredictor();
  predictor.train(dataset);

  const scenarios = generateEvaluationScenarios();

  const evaluations = runControlledEvaluation(scenarios, predictor);

  const summary = calculateEvaluationSummary(evaluations);

  console.log("=== CONTROLLED BASELINE EVALUATION ===");

  console.log("Scenario count:", summary.scenarioCount);

  for (const system of summary.systems) {
    console.log({
      system: system.system,
      scenarioCount: system.scenarioCount,
      interventionRate: system.interventionRate,
      noActionRate: system.noActionRate,
      averageEnergySaving: system.averageEnergySaving,
      averageUXImpact: system.averageUXImpact,
      averageScore: system.averageScore,
      actionCounts: system.actionCounts,
    });
  }

  console.log("=== PERSONALIZATION EFFECT ===");

  console.log(summary.personalizationDifference);
}
