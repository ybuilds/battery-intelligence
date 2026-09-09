import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentalRecord } from "./experimental-record";

export type PersonalizationComparison = {
  appName: string;

  block: number;

  repetition: number;

  behaviourAwareDrainRate: number;

  personalizedDrainRate: number;

  drainRateDifference: number;

  improvementPercent: number;
};

export type PersonalizationAnalysisResult = {
  baselineSystem: BaselineSystem;

  personalizedSystem: BaselineSystem;

  sampleSize: number;

  meanBehaviourAwareDrainRate: number;

  meanPersonalizedDrainRate: number;

  meanDrainRateDifference: number;

  meanImprovementPercent: number;

  standardDeviationOfDifference: number;

  standardError: number;

  confidenceIntervalLower: number;

  confidenceIntervalUpper: number;

  cohensDz: number;

  zStatistic: number;

  pValue: number | undefined;

  directionSupportsH2: boolean;

  statisticalSignificance: boolean | undefined;

  interpretation: string;

  comparisons: PersonalizationComparison[];
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

  const squaredDifferences = values.reduce(
    (sum, value) => sum + Math.pow(value - average, 2),
    0,
  );

  return Math.sqrt(squaredDifferences / (values.length - 1));
}

/*
 * Standard normal cumulative distribution
 * function using an approximation to erf().
 *
 * This is sufficient for the current
 * lightweight evaluation layer. Final
 * publication analysis should preferably
 * be reproduced with a validated statistical
 * package such as R or Python.
 */
function normalCdf(value: number): number {
  const sign = value < 0 ? -1 : 1;

  const absoluteValue = Math.abs(value) / Math.sqrt(2);

  const t = 1 / (1 + 0.3275911 * absoluteValue);

  const coefficients = [
    1.061405429, -1.453152027, 1.421413741, -0.284496736, 0.254829592,
  ];

  let polynomial = coefficients[4];

  for (let index = 3; index >= 0; index -= 1) {
    polynomial = polynomial * t + coefficients[index];
  }

  const erf = 1 - polynomial * t * Math.exp(-absoluteValue * absoluteValue);

  const signedErf = sign * erf;

  return 0.5 * (1 + signedErf);
}

function calculateTwoSidedNormalPValue(zStatistic: number): number {
  const cdf = normalCdf(Math.abs(zStatistic));

  return 2 * (1 - cdf);
}

function buildComparisonGroups(
  records: ExperimentalRecord[],
): Map<string, ExperimentalRecord[]> {
  const interventionRecords = records.filter(
    (record) =>
      record.condition === "intervention" &&
      (record.system === "behaviour_aware" || record.system === "personalized"),
  );

  const groups = new Map<string, ExperimentalRecord[]>();

  for (const record of interventionRecords) {
    const key = [record.appName, record.block, record.repetition].join("|");

    const existing = groups.get(key) ?? [];

    existing.push(record);

    groups.set(key, existing);
  }

  return groups;
}

export function buildPersonalizationComparisons(
  records: ExperimentalRecord[],
): PersonalizationComparison[] {
  const groups = buildComparisonGroups(records);

  const comparisons: PersonalizationComparison[] = [];

  for (const group of groups.values()) {
    const behaviourAware = group.find(
      (record) => record.system === "behaviour_aware",
    );

    const personalized = group.find(
      (record) => record.system === "personalized",
    );

    if (!behaviourAware || !personalized) {
      continue;
    }

    /*
     * Difference is defined as:
     *
     * B4 - B3
     *
     * Therefore:
     *
     * negative = B4 drains less
     * positive = B4 drains more
     */
    const drainRateDifference =
      personalized.batteryDrainRate - behaviourAware.batteryDrainRate;

    const improvementPercent =
      behaviourAware.batteryDrainRate !== 0
        ? ((behaviourAware.batteryDrainRate - personalized.batteryDrainRate) /
            Math.abs(behaviourAware.batteryDrainRate)) *
          100
        : 0;

    comparisons.push({
      appName: behaviourAware.appName,

      block: behaviourAware.block,

      repetition: behaviourAware.repetition,

      behaviourAwareDrainRate: behaviourAware.batteryDrainRate,

      personalizedDrainRate: personalized.batteryDrainRate,

      drainRateDifference,

      improvementPercent,
    });
  }

  return comparisons;
}

export function analyzePersonalizationBenefit(
  records: ExperimentalRecord[],
  alpha = 0.0125,
): PersonalizationAnalysisResult {
  const comparisons = buildPersonalizationComparisons(records);

  const behaviourAwareValues = comparisons.map(
    (comparison) => comparison.behaviourAwareDrainRate,
  );

  const personalizedValues = comparisons.map(
    (comparison) => comparison.personalizedDrainRate,
  );

  const differences = comparisons.map(
    (comparison) => comparison.drainRateDifference,
  );

  const improvementPercentages = comparisons.map(
    (comparison) => comparison.improvementPercent,
  );

  const sampleSize = differences.length;

  const meanBehaviourAwareDrainRate = mean(behaviourAwareValues);

  const meanPersonalizedDrainRate = mean(personalizedValues);

  const meanDrainRateDifference = mean(differences);

  const meanImprovementPercent = mean(improvementPercentages);

  const standardDeviationOfDifference = sampleStandardDeviation(differences);

  const standardError =
    sampleSize > 1 ? standardDeviationOfDifference / Math.sqrt(sampleSize) : 0;

  const confidenceIntervalMargin = 1.96 * standardError;

  const confidenceIntervalLower =
    meanDrainRateDifference - confidenceIntervalMargin;

  const confidenceIntervalUpper =
    meanDrainRateDifference + confidenceIntervalMargin;

  const cohensDz =
    standardDeviationOfDifference > 0
      ? meanDrainRateDifference / standardDeviationOfDifference
      : 0;

  const zStatistic =
    standardError > 0 ? meanDrainRateDifference / standardError : 0;

  const pValue =
    sampleSize > 1 && standardError > 0
      ? calculateTwoSidedNormalPValue(zStatistic)
      : undefined;

  const directionSupportsH2 = sampleSize > 0 && meanDrainRateDifference < 0;

  const statisticalSignificance =
    pValue !== undefined ? pValue < alpha : undefined;

  let interpretation =
    "Insufficient matched B3/B4 intervention trials for personalization analysis.";

  if (sampleSize > 1) {
    if (directionSupportsH2 && statisticalSignificance) {
      interpretation = `Personalized Intelligence produced a lower mean battery drain rate than the Behaviour-Aware baseline by ${Math.abs(
        meanDrainRateDifference,
      ).toFixed(
        4,
      )} percentage points per minute, corresponding to an average improvement of ${meanImprovementPercent.toFixed(
        2,
      )}%. The matched B3/B4 comparison is statistically significant at the adjusted alpha level.`;
    } else if (directionSupportsH2) {
      interpretation = `Personalized Intelligence produced a lower mean battery drain rate than the Behaviour-Aware baseline by ${Math.abs(
        meanDrainRateDifference,
      ).toFixed(
        4,
      )} percentage points per minute, corresponding to an average improvement of ${meanImprovementPercent.toFixed(
        2,
      )}%. The observed direction supports H2, but the matched difference is not statistically significant at the adjusted alpha level.`;
    } else if (meanDrainRateDifference > 0) {
      interpretation = `Personalized Intelligence produced a higher mean battery drain rate than the Behaviour-Aware baseline by ${meanDrainRateDifference.toFixed(
        4,
      )} percentage points per minute. The observed direction does not support H2.`;
    } else {
      interpretation =
        "Personalized Intelligence and the Behaviour-Aware baseline produced the same mean battery drain rate.";
    }
  }

  return {
    baselineSystem: "behaviour_aware",

    personalizedSystem: "personalized",

    sampleSize,

    meanBehaviourAwareDrainRate,

    meanPersonalizedDrainRate,

    meanDrainRateDifference,

    meanImprovementPercent,

    standardDeviationOfDifference,

    standardError,

    confidenceIntervalLower,

    confidenceIntervalUpper,

    cohensDz,

    zStatistic,

    pValue,

    directionSupportsH2,

    statisticalSignificance,

    interpretation,

    comparisons,
  };
}
