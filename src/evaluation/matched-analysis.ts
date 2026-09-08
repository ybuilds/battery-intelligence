import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentalRecord } from "./experimental-record";

export type MatchedTrialComparison = {
  system: BaselineSystem;

  appName: string;

  block: number;

  repetition: number;

  controlDrainRate: number;

  interventionDrainRate: number;

  batteryDrainReduction: number;

  batteryDrainReductionPercent: number;
};

export function buildMatchedComparisons(
  records: ExperimentalRecord[],
  system: BaselineSystem,
): MatchedTrialComparison[] {
  const systemRecords = records.filter((record) => record.system === system);

  const groups = new Map<string, ExperimentalRecord[]>();

  for (const record of systemRecords) {
    const key = [record.appName, record.block, record.repetition].join("|");

    const existing = groups.get(key) ?? [];

    existing.push(record);

    groups.set(key, existing);
  }

  const comparisons: MatchedTrialComparison[] = [];

  for (const group of groups.values()) {
    const control = group.find((record) => record.condition === "control");

    const intervention = group.find(
      (record) => record.condition === "intervention",
    );

    if (!control || !intervention) {
      continue;
    }

    const batteryDrainReduction =
      control.batteryDrainRate - intervention.batteryDrainRate;

    const batteryDrainReductionPercent =
      control.batteryDrainRate !== 0
        ? (batteryDrainReduction / Math.abs(control.batteryDrainRate)) * 100
        : 0;

    comparisons.push({
      system,

      appName: control.appName,

      block: control.block,

      repetition: control.repetition,

      controlDrainRate: control.batteryDrainRate,

      interventionDrainRate: intervention.batteryDrainRate,

      batteryDrainReduction,

      batteryDrainReductionPercent,
    });
  }

  return comparisons;
}
