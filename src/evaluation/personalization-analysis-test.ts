import type { ExperimentalRecord } from "./experimental-record";
import {
    analyzePersonalizationBenefit,
    buildPersonalizationComparisons,
} from "./personalization-analysis";

function createSyntheticRecords(): ExperimentalRecord[] {
  const records: ExperimentalRecord[] = [];

  for (let repetition = 1; repetition <= 10; repetition += 1) {
    const behaviourAwareDrain = 0.5 + repetition * 0.005;

    const personalizedDrain = 0.4 + repetition * 0.004;

    records.push({
      trialId: `b3-${repetition}`,

      system: "behaviour_aware",

      condition: "intervention",

      appName: "Instagram",

      batteryBefore: 50,

      batteryAfter: 50 - behaviourAwareDrain * 20,

      durationMinutes: 20,

      batteryDelta: behaviourAwareDrain * 20,

      batteryDrainRate: behaviourAwareDrain,

      block: 1,

      repetition,

      recordedAt: new Date().toISOString(),
    });

    records.push({
      trialId: `b4-${repetition}`,

      system: "personalized",

      condition: "intervention",

      appName: "Instagram",

      batteryBefore: 50,

      batteryAfter: 50 - personalizedDrain * 20,

      durationMinutes: 20,

      batteryDelta: personalizedDrain * 20,

      batteryDrainRate: personalizedDrain,

      block: 1,

      repetition,

      recordedAt: new Date().toISOString(),
    });
  }

  return records;
}

export function testPersonalizationAnalysis(): void {
  const records = createSyntheticRecords();

  const comparisons = buildPersonalizationComparisons(records);

  const result = analyzePersonalizationBenefit(records);

  console.log("Matched B3/B4 comparisons:", comparisons);

  console.log("Personalization analysis:", result);
}

testPersonalizationAnalysis();
