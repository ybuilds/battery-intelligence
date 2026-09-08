import type { ExperimentalRecord } from "./experimental-record";

import { evaluateResearchHypotheses } from "./final-hypothesis-evaluation";

function createSyntheticDataset(): ExperimentalRecord[] {
  const records: ExperimentalRecord[] = [];

  for (let repetition = 1; repetition <= 10; repetition += 1) {
    /*
     * Personalized control.
     */
    records.push({
      trialId: `personalized-control-${repetition}`,

      system: "personalized",

      condition: "control",

      appName: "Instagram",

      batteryBefore: 50,

      batteryAfter: 40,

      durationMinutes: 20,

      batteryDelta: 10,

      batteryDrainRate: 0.5,

      uxImpact: undefined,

      userAcceptance: undefined,

      block: 1,

      repetition,

      recordedAt: new Date().toISOString(),
    });

    /*
     * Personalized intervention.
     */
    records.push({
      trialId: `personalized-intervention-${repetition}`,

      system: "personalized",

      condition: "intervention",

      appName: "Instagram",

      batteryBefore: 50,

      batteryAfter: 41,

      durationMinutes: 20,

      batteryDelta: 9,

      batteryDrainRate: 0.45,

      uxImpact: 0.35,

      userAcceptance: 1,

      block: 1,

      repetition,

      recordedAt: new Date().toISOString(),
    });

    /*
     * Behaviour-Aware intervention.
     */
    records.push({
      trialId: `behaviour-aware-intervention-${repetition}`,

      system: "behaviour_aware",

      condition: "intervention",

      appName: "Instagram",

      batteryBefore: 50,

      batteryAfter: 39,

      durationMinutes: 20,

      batteryDelta: 11,

      batteryDrainRate: 0.55,

      uxImpact: 0.55,

      userAcceptance: 0,

      block: 1,

      repetition,

      recordedAt: new Date().toISOString(),
    });
  }

  return records;
}

export function testFinalHypothesisEvaluation(): void {
  const records = createSyntheticDataset();

  const result = evaluateResearchHypotheses(records);

  console.log("Final research hypothesis evaluation:", result);
}

testFinalHypothesisEvaluation();
