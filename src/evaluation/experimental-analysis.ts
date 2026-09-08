import type { BaselineSystem } from "../baselines/baseline-types";
import { calculateBatteryMetrics } from "./battery-analysis";
import type { ExperimentalRecord } from "./experimental-record";
import {
  calculateApproximate95CI,
  calculateStatisticalSummary,
} from "./statistical-analysis";
import { calculateUXMetrics } from "./ux-analysis";

import type { ExperimentalDataset } from "./experimental-dataset";
import { getSystems, groupRecordsBySystem } from "./experimental-dataset";

export type ExperimentalSystemReport = {
  system: BaselineSystem;

  battery: {
    sampleCount: number;
    meanDrainRate: number;
    standardDeviation: number;
    standardError: number;
    confidenceInterval95: {
      lower: number;
      upper: number;
    };
  };

  ux: {
    sampleCount: number;
    meanImpact: number;
  };

  acceptance: {
    sampleCount: number;
    rate: number;
  };
};

export function generateSystemReport(
  system: BaselineSystem,
  records: ExperimentalRecord[],
): ExperimentalSystemReport {
  const battery = calculateBatteryMetrics(system, records);

  const ux = calculateUXMetrics(system, records);

  const statistical = calculateStatisticalSummary(
    system,
    records.map((record) => record.batteryDrainRate),
  );

  const confidenceInterval95 = calculateApproximate95CI(statistical);

  return {
    system,

    battery: {
      sampleCount: statistical.sampleCount,

      meanDrainRate: statistical.mean,

      standardDeviation: statistical.standardDeviation,

      standardError: statistical.standardError,

      confidenceInterval95,
    },

    ux: {
      sampleCount: ux.uxSampleCount,

      meanImpact: ux.meanUXImpact,
    },

    acceptance: {
      sampleCount: ux.acceptanceSampleCount,

      rate: ux.acceptanceRate,
    },
  };
}

export type ExperimentalAnalysisReport = {
  totalRecords: number;
  systems: ExperimentalSystemReport[];
};

export function generateExperimentalReport(
  dataset: ExperimentalDataset,
): ExperimentalAnalysisReport {
  const grouped = groupRecordsBySystem(dataset);

  return {
    totalRecords: dataset.records.length,

    systems: getSystems().map((system) =>
      generateSystemReport(system, grouped[system]),
    ),
  };
}
