import { evaluateBaseline } from "./baseline-evaluator";

export function testBaselineEvaluator() {
  const result = evaluateBaseline(1000);

  console.log("Baseline evaluation:");

  console.log("Scenarios:", result.scenarioCount);

  console.log("Average energy score:", result.averageEnergyScore);

  console.log("Average UX score:", result.averageUXScore);

  console.log("Average preference score:", result.averagePreferenceScore);

  console.log("Average overall score:", result.averageOverallScore);

  console.log("Action distribution:", result.actionDistribution);
}
