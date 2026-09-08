import type { BaselineSystem } from "../baselines/baseline-types";
import type { StatisticalSummary, SystemComparison } from "./statistical-types";

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;

  return Math.round(value * factor) / factor;
}

export function calculateMean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateStandardDeviation(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const mean = calculateMean(values);

  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (values.length - 1);

  return Math.sqrt(variance);
}

export function calculateStatisticalSummary(
  system: BaselineSystem,
  values: number[],
): StatisticalSummary {
  const mean = calculateMean(values);

  const standardDeviation = calculateStandardDeviation(values);

  const standardError =
    values.length > 0 ? standardDeviation / Math.sqrt(values.length) : 0;

  return {
    system,

    sampleCount: values.length,

    mean: round(mean),

    standardDeviation: round(standardDeviation),

    standardError: round(standardError),

    minimum: values.length > 0 ? round(Math.min(...values)) : 0,

    maximum: values.length > 0 ? round(Math.max(...values)) : 0,
  };
}

export function compareSystems(
  systemA: BaselineSystem,
  valuesA: number[],
  systemB: BaselineSystem,
  valuesB: number[],
): SystemComparison {
  const meanA = calculateMean(valuesA);
  const meanB = calculateMean(valuesB);

  const difference = meanA - meanB;

  let effectDirection: "higher" | "lower" | "equal";

  if (difference > 0) {
    effectDirection = "higher";
  } else if (difference < 0) {
    effectDirection = "lower";
  } else {
    effectDirection = "equal";
  }

  return {
    systemA,
    systemB,
    meanDifference: round(difference),
    effectDirection,
  };
}

export function calculateApproximate95CI(summary: StatisticalSummary): {
  lower: number;
  upper: number;
} {
  const margin = 1.96 * summary.standardError;

  return {
    lower: round(summary.mean - margin),
    upper: round(summary.mean + margin),
  };
}
