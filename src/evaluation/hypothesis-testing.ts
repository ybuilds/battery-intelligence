import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentalRecord } from "./experimental-record";

export type StatisticalTestResult = {
  comparison: string;

  systemA: BaselineSystem;
  systemB: BaselineSystem;

  sampleSizeA: number;
  sampleSizeB: number;

  meanA: number;
  meanB: number;

  difference: number;

  relativeDifferencePercent: number;

  testName: string;

  pValue?: number;

  statisticallySignificant?: boolean;

  interpretation: string;
};

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getMetricValues(
  records: ExperimentalRecord[],
  metric: "batteryDrainRate" | "uxImpact" | "userAcceptance",
): number[] {
  return records
    .map((record) => record[metric])
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );
}

export function compareSystems(
  records: ExperimentalRecord[],
  systemA: BaselineSystem,
  systemB: BaselineSystem,
  metric: "batteryDrainRate" | "uxImpact" | "userAcceptance",
): StatisticalTestResult {
  const recordsA = records.filter(
    (record) =>
      record.system === systemA && record.condition === "intervention",
  );

  const recordsB = records.filter(
    (record) =>
      record.system === systemB && record.condition === "intervention",
  );

  const valuesA = getMetricValues(recordsA, metric);

  const valuesB = getMetricValues(recordsB, metric);

  const meanA = mean(valuesA);
  const meanB = mean(valuesB);

  const difference = meanA - meanB;

  const relativeDifferencePercent =
    meanB !== 0 ? (difference / Math.abs(meanB)) * 100 : 0;

  return {
    comparison: `${systemA} vs ${systemB}`,

    systemA,
    systemB,

    sampleSizeA: valuesA.length,
    sampleSizeB: valuesB.length,

    meanA,
    meanB,

    difference,

    relativeDifferencePercent,

    testName: "Descriptive comparison",

    interpretation:
      valuesA.length === 0 || valuesB.length === 0
        ? "Insufficient data for comparison."
        : `${metric}: ${systemA} mean=${meanA.toFixed(
            4,
          )}, ${systemB} mean=${meanB.toFixed(4)}.`,
  };
}
