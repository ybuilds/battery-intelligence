import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentalRecord } from "./experimental-record";
import {
    buildMatchedComparisons,
    type MatchedTrialComparison,
} from "./matched-analysis";

export type PairedTestResult = {
  system: BaselineSystem;

  metric: "batteryDrainRate";

  sampleSize: number;

  meanDifference: number;

  standardDeviationOfDifference: number;

  standardError: number;

  tStatistic: number;

  degreesOfFreedom: number;

  pValue?: number;

  statisticallySignificant?: boolean;

  alpha: number;

  interpretation: string;
};

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleStandardDeviation(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const average = mean(values);

  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) /
    (values.length - 1);

  return Math.sqrt(variance);
}

/**
 * Approximation of the two-tailed Student's t CDF.
 *
 * This implementation intentionally avoids
 * adding a heavyweight statistics dependency.
 */
function normalCdf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const absoluteValue = Math.abs(value);

  const t = 1 / (1 + 0.2316419 * absoluteValue);

  const d = 0.3989423 * Math.exp(-(absoluteValue * absoluteValue) / 2);

  const probability =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return sign === 1 ? 1 - probability : probability;
}

/**
 * For moderate-to-large degrees of freedom,
 * the normal approximation provides a useful
 * lightweight fallback.
 *
 * Final publication analysis should use a
 * validated statistical library or statistical
 * software such as R/Python.
 */
function approximateTwoTailedPValue(
  tStatistic: number,
  degreesOfFreedom: number,
): number {
  if (degreesOfFreedom <= 0) {
    return 1;
  }

  const normalApproximation = 2 * (1 - normalCdf(Math.abs(tStatistic)));

  return Math.min(1, Math.max(0, normalApproximation));
}

function getDifferences(comparisons: MatchedTrialComparison[]): number[] {
  return comparisons.map(
    (comparison) =>
      comparison.interventionDrainRate - comparison.controlDrainRate,
  );
}

export function runPairedBatteryDrainTest(
  records: ExperimentalRecord[],
  system: BaselineSystem,
  alpha = 0.05,
): PairedTestResult {
  const comparisons = buildMatchedComparisons(records, system);

  const differences = getDifferences(comparisons);

  const sampleSize = differences.length;

  const meanDifference = mean(differences);

  const standardDeviationOfDifference = sampleStandardDeviation(differences);

  const standardError =
    sampleSize > 0 ? standardDeviationOfDifference / Math.sqrt(sampleSize) : 0;

  const tStatistic = standardError > 0 ? meanDifference / standardError : 0;

  const degreesOfFreedom = Math.max(0, sampleSize - 1);

  const pValue =
    sampleSize >= 2
      ? approximateTwoTailedPValue(tStatistic, degreesOfFreedom)
      : undefined;

  const statisticallySignificant =
    pValue !== undefined ? pValue < alpha : undefined;

  let interpretation =
    "Insufficient matched observations for hypothesis testing.";

  if (sampleSize >= 2) {
    if (statisticallySignificant && meanDifference < 0) {
      interpretation =
        "The intervention produced a statistically significant reduction in measured battery drain rate compared with matched control trials.";
    } else if (statisticallySignificant && meanDifference > 0) {
      interpretation =
        "The intervention produced a statistically significant increase in measured battery drain rate compared with matched control trials.";
    } else if (statisticallySignificant) {
      interpretation =
        "A statistically significant difference was detected, but the direction should be interpreted from the mean difference.";
    } else {
      interpretation =
        "No statistically significant difference was detected at the selected alpha level.";
    }
  }

  return {
    system,

    metric: "batteryDrainRate",

    sampleSize,

    meanDifference,

    standardDeviationOfDifference,

    standardError,

    tStatistic,

    degreesOfFreedom,

    pValue,

    statisticallySignificant,

    alpha,

    interpretation,
  };
}

export function runPersonalizationHypothesisTest(
  records: ExperimentalRecord[],
): PairedTestResult {
  return runPairedBatteryDrainTest(records, "personalized");
}

export function runBehaviourAwareHypothesisTest(
  records: ExperimentalRecord[],
): PairedTestResult {
  return runPairedBatteryDrainTest(records, "behaviour_aware");
}
