import { analyzeAcceptance } from "./acceptance-analysis";
import type { ExperimentalRecord } from "./experimental-record";

function createSyntheticRecords(): ExperimentalRecord[] {
  const records: ExperimentalRecord[] = [];

  for (let repetition = 1; repetition <= 10; repetition += 1) {
    const behaviourAwareAcceptance = repetition <= 4 ? 0 : 1;

    const personalizedAcceptance = repetition <= 2 ? 0 : 1;

    records.push({
      trialId: `acceptance-b3-${repetition}`,

      system: "behaviour_aware",

      condition: "intervention",

      appName: "Instagram",

      batteryBefore: 50,

      batteryAfter: 40,

      durationMinutes: 20,

      batteryDelta: 10,

      batteryDrainRate: 0.5,

      userAcceptance: behaviourAwareAcceptance as 0 | 1,

      block: 1,

      repetition,

      recordedAt: new Date().toISOString(),
    });

    records.push({
      trialId: `acceptance-b4-${repetition}`,

      system: "personalized",

      condition: "intervention",

      appName: "Instagram",

      batteryBefore: 50,

      batteryAfter: 41,

      durationMinutes: 20,

      batteryDelta: 9,

      batteryDrainRate: 0.45,

      userAcceptance: personalizedAcceptance as 0 | 1,

      block: 1,

      repetition,

      recordedAt: new Date().toISOString(),
    });
  }

  return records;
}

export function testAcceptanceAnalysis(): void {
  const records = createSyntheticRecords();

  const result = analyzeAcceptance(records);

  console.log("User acceptance analysis:", result);
}

testAcceptanceAnalysis();
