import { runDefaultSensitivityAnalysis } from "./sensitivity-analysis";

export function testSensitivityAnalysis() {
  const results = runDefaultSensitivityAnalysis(1000);

  console.log("Sensitivity analysis:");

  for (const result of results) {
    console.log("Configuration:", result.configuration);

    console.log("Scenario count:", result.scenarioCount);

    console.log("Average overall score:", result.averageOverallScore);

    console.log("Action distribution:", result.actionDistribution);

    console.log("-----------------------------");
  }
}
