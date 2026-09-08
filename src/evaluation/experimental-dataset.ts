import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentalRecord } from "./experimental-record";

export type ExperimentalDataset = {
  records: ExperimentalRecord[];
};

export type SystemRecords = Record<BaselineSystem, ExperimentalRecord[]>;

const SYSTEMS: BaselineSystem[] = [
  "battery_only",
  "rule_based",
  "behaviour_aware",
  "personalized",
];

export function createExperimentalDataset(
  records: ExperimentalRecord[],
): ExperimentalDataset {
  return {
    records: [...records],
  };
}

export function groupRecordsBySystem(
  dataset: ExperimentalDataset,
): SystemRecords {
  const grouped: SystemRecords = {
    battery_only: [],
    rule_based: [],
    behaviour_aware: [],
    personalized: [],
  };

  for (const record of dataset.records) {
    grouped[record.system].push(record);
  }

  return grouped;
}

export function getSystems(): BaselineSystem[] {
  return [...SYSTEMS];
}
