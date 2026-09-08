import type { BaselineSystem } from "../baselines/baseline-types";
import { generateEvaluationScenarios } from "../evaluation/evaluation-scenarios";
import { generateOutcomeDataset } from "../intelligence/outcome-dataset";
import { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";
import {
  completeTrial,
  executePlannedTrial,
  planTrial,
} from "./trial-orchestrator";

export function testTrialOrchestration(): void {
  const dataset = generateOutcomeDataset(2000);

  const predictor = new LightweightOutcomePredictor();

  predictor.train(dataset);

  const scenarios = generateEvaluationScenarios();

  const systems: BaselineSystem[] = [
    "battery_only",
    "rule_based",
    "behaviour_aware",
    "personalized",
  ];

  const scenario = scenarios[0];

  if (!scenario) {
    throw new Error("No evaluation scenario is available.");
  }

  console.log("=== TRIAL ORCHESTRATION ===");

  for (const system of systems) {
    const planned = planTrial(system, "intervention", scenario, 1);

    const execution = executePlannedTrial(planned, predictor);

    const completed = completeTrial(execution);

    console.log({
      system: completed.system,

      condition: completed.condition,

      scenario: completed.scenarioId,

      selectedAction: completed.decision.selectedAction,

      energySaving: completed.decision.estimatedEnergySaving,

      uxImpact: completed.decision.estimatedUXImpact,

      status: completed.status,
    });
  }

  const controlTrial = planTrial("personalized", "control", scenario, 1);

  const controlExecution = executePlannedTrial(controlTrial, predictor);

  console.log({
    system: controlExecution.system,

    condition: controlExecution.condition,

    selectedAction: controlExecution.decision.selectedAction,
  });
}
