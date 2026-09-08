import { generateExperimentalReport } from "./experimental-analysis";
import { createExperimentalDataset } from "./experimental-dataset";
import type { ExperimentalRecord } from "./experimental-record";

export function testExperimentalAnalysis(): void {
  const records: ExperimentalRecord[] = [
    {
      trialId: "trial-001",
      system: "battery_only",
      condition: "control",
      appName: "Instagram",
      batteryBefore: 40,
      batteryAfter: 38,
      durationMinutes: 20,
      batteryDelta: 2,
      batteryDrainRate: 0.1,
      uxImpact: 0,
      userAcceptance: 1,
      recordedAt: "2026-09-08T10:00:00.000Z",
      block: 1,
      repetition: 1,
    },

    {
      trialId: "trial-002",
      system: "rule_based",
      condition: "intervention",
      appName: "Instagram",
      batteryBefore: 40,
      batteryAfter: 39,
      durationMinutes: 20,
      batteryDelta: 1,
      batteryDrainRate: 0.05,
      uxImpact: 0.25,
      userAcceptance: 1,
      recordedAt: "2026-09-08T11:00:00.000Z",
      block: 1,
      repetition: 2,
    },

    {
      trialId: "trial-003",
      system: "behaviour_aware",
      condition: "intervention",
      appName: "Instagram",
      batteryBefore: 40,
      batteryAfter: 39,
      durationMinutes: 20,
      batteryDelta: 1,
      batteryDrainRate: 0.05,
      uxImpact: 0.15,
      userAcceptance: 1,
      recordedAt: "2026-09-08T12:00:00.000Z",
      block: 1,
      repetition: 3,
    },

    {
      trialId: "trial-004",
      system: "personalized",
      condition: "intervention",
      appName: "Instagram",
      batteryBefore: 40,
      batteryAfter: 39.5,
      durationMinutes: 20,
      batteryDelta: 0.5,
      batteryDrainRate: 0.025,
      uxImpact: 0.1,
      userAcceptance: 1,
      recordedAt: "2026-09-08T13:00:00.000Z",
      block: 1,
      repetition: 4,
    },
  ];

  const dataset = createExperimentalDataset(records);

  const report = generateExperimentalReport(dataset);

  console.log("=== EXPERIMENTAL ANALYSIS ===");

  console.log("Total records:", report.totalRecords);

  for (const system of report.systems) {
    console.log({
      system: system.system,

      sampleCount: system.battery.sampleCount,

      meanDrainRate: system.battery.meanDrainRate,

      standardDeviation: system.battery.standardDeviation,

      confidenceInterval95: system.battery.confidenceInterval95,

      meanUXImpact: system.ux.meanImpact,

      acceptanceRate: system.acceptance.rate,
    });
  }
}
