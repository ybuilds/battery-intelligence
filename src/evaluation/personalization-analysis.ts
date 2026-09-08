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

  directionSupportsH2: boolean;

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
    sampleSize > 0 ? standardDeviationOfDifference / Math.sqrt(sampleSize) : 0;

  const confidenceIntervalMargin = 1.96 * standardError;

  const confidenceIntervalLower =
    meanDrainRateDifference - confidenceIntervalMargin;

  const confidenceIntervalUpper =
    meanDrainRateDifference + confidenceIntervalMargin;

  const cohensDz =
    standardDeviationOfDifference > 0
      ? meanDrainRateDifference / standardDeviationOfDifference
      : 0;

  const directionSupportsH2 = sampleSize > 0 && meanDrainRateDifference < 0;

  let interpretation =
    "Insufficient matched B3/B4 intervention trials for personalization analysis.";

  if (sampleSize > 0) {
    if (directionSupportsH2) {
      interpretation = `Personalized Intelligence produced a lower mean battery drain rate than the Behaviour-Aware baseline by ${Math.abs(
        meanDrainRateDifference,
      ).toFixed(
        4,
      )} percentage points per minute, corresponding to an average improvement of ${meanImprovementPercent.toFixed(
        2,
      )}%. The observed direction supports H2, but statistical significance must be established with the final inferential test.`;
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

    directionSupportsH2,

    interpretation,

    comparisons,
  };
}
