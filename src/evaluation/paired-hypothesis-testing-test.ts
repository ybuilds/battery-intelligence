import type { ExperimentalRecord } from "./experimental-record";
import {
    runBehaviourAwareHypothesisTest,
    runPersonalizationHypothesisTest,
} from "./paired-hypothesis-testing";

function createSyntheticMatchedRecords(): ExperimentalRecord[] {
  const records: ExperimentalRecord[] = [];

  for (let repetition = 1; repetition <= 10; repetition += 1) {
    const controlDrain = 0.5;

    const interventionDrain = 0.35 + (repetition % 3) * 0.01;

    records.push({
      trialId: `personalized-control-${repetition}`,
      system: "personalized",
      condition: "control",
      appName: "Instagram",
      block: 1,
      repetition,
      batteryBefore: 50,
      batteryAfter: 50 - controlDrain * 20,
      durationMinutes: 20,
      batteryDelta: controlDrain * 20,
      batteryDrainRate: controlDrain,
      recordedAt: new Date().toISOString(),
    });

    records.push({
      trialId: `personalized-intervention-${repetition}`,
      system: "personalized",
      condition: "intervention",
      appName: "Instagram",
      block: 1,
      repetition,
      batteryBefore: 50,
      batteryAfter: 50 - interventionDrain * 20,
      durationMinutes: 20,
      batteryDelta: interventionDrain * 20,
      batteryDrainRate: interventionDrain,
      recordedAt: new Date().toISOString(),
    });
  }

  return records;
}

export function testPairedHypothesisTesting(): void {
  const records = createSyntheticMatchedRecords();

  const personalized = runPersonalizationHypothesisTest(records);

  const behaviourAware = runBehaviourAwareHypothesisTest(records);

  console.log("Personalized paired test:", personalized);

  console.log("Behaviour-aware paired test:", behaviourAware);
}

testPairedHypothesisTesting();
