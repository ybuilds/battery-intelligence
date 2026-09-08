import type { ExperimentalRecord } from "./experimental-record";
import { analyzeUXHypothesis } from "./ux-hypothesis-testing";

function createSyntheticRecords(): ExperimentalRecord[] {
  const records: ExperimentalRecord[] = [];

  for (let repetition = 1; repetition <= 10; repetition += 1) {
    const baselineUX = 0.6 + repetition * 0.005;

    const personalizedUX = 0.4 + repetition * 0.004;

    records.push({
      trialId: `ux-b3-${repetition}`,

      system: "behaviour_aware",

      condition: "intervention",

      appName: "Instagram",

      batteryBefore: 50,

      batteryAfter: 40,

      durationMinutes: 20,

      batteryDelta: 10,

      batteryDrainRate: 0.5,

      uxImpact: baselineUX,

      block: 1,

      repetition,

      recordedAt: new Date().toISOString(),
    });

    records.push({
      trialId: `ux-b4-${repetition}`,

      system: "personalized",

      condition: "intervention",

      appName: "Instagram",

      batteryBefore: 50,

      batteryAfter: 41,

      durationMinutes: 20,

      batteryDelta: 9,

      batteryDrainRate: 0.45,

      uxImpact: personalizedUX,

      block: 1,

      repetition,

      recordedAt: new Date().toISOString(),
    });
  }

  return records;
}

export function testUXHypothesis(): void {
  const records = createSyntheticRecords();

  const result = analyzeUXHypothesis(records);

  console.log("UX hypothesis analysis:", result);
}

testUXHypothesis();
