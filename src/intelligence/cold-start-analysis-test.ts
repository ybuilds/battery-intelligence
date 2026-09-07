import { runColdStartAnalysis } from "./cold-start-analysis";

export function testColdStartAnalysis() {
  const results = runColdStartAnalysis([0, 1, 5, 10, 25, 50, 100, 250]);

  console.log("Cold-start personalization analysis:");

  for (const result of results) {
    console.log({
      observations: result.observationCount,

      confidence: result.profileConfidence,

      generalModelWeight: result.generalModelWeight,

      personalizedModelWeight: result.personalizedModelWeight,
    });
  }
}
