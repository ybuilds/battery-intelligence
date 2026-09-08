import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentalRecord } from "./experimental-record";

export type AcceptanceComparison = {
  appName: string;
  block: number;
  repetition: number;

  behaviourAwareAcceptance: number;
  personalizedAcceptance: number;

  acceptanceDifference: number;
};

export type AcceptanceAnalysisResult = {
  baselineSystem: BaselineSystem;
  personalizedSystem: BaselineSystem;

  sampleSize: number;

  meanBehaviourAwareAcceptance: number;
  meanPersonalizedAcceptance: number;

  acceptanceDifference: number;
  acceptanceImprovementPercent: number;

  standardDeviationOfDifference: number;
  standardError: number;

  confidenceIntervalLower: number;
  confidenceIntervalUpper: number;

  cohensDz: number;

  directionSupportsH4: boolean;

  interpretation: string;

  comparisons: AcceptanceComparison[];
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

function buildMatchedAcceptanceComparisons(
  records: ExperimentalRecord[],
): AcceptanceComparison[] {
  const eligibleRecords = records.filter(
    (record) =>
      record.condition === "intervention" &&
      (record.system === "behaviour_aware" ||
        record.system === "personalized") &&
      typeof record.userAcceptance === "number" &&
      Number.isFinite(record.userAcceptance),
  );

  const groups = new Map<string, ExperimentalRecord[]>();

  for (const record of eligibleRecords) {
    const key = [record.appName, record.block, record.repetition].join("|");

    const existing = groups.get(key) ?? [];

    existing.push(record);

    groups.set(key, existing);
  }

  const comparisons: AcceptanceComparison[] = [];

  for (const group of groups.values()) {
    const behaviourAware = group.find(
      (record) => record.system === "behaviour_aware",
    );

    const personalized = group.find(
      (record) => record.system === "personalized",
    );

    if (
      !behaviourAware ||
      !personalized ||
      behaviourAware.userAcceptance === undefined ||
      personalized.userAcceptance === undefined
    ) {
      continue;
    }

    comparisons.push({
      appName: behaviourAware.appName,

      block: behaviourAware.block,

      repetition: behaviourAware.repetition,

      behaviourAwareAcceptance: behaviourAware.userAcceptance,

      personalizedAcceptance: personalized.userAcceptance,

      acceptanceDifference:
        personalized.userAcceptance - behaviourAware.userAcceptance,
    });
  }

  return comparisons;
}

export function analyzeAcceptance(
  records: ExperimentalRecord[],
): AcceptanceAnalysisResult {
  const comparisons = buildMatchedAcceptanceComparisons(records);

  const behaviourAwareValues = comparisons.map(
    (comparison) => comparison.behaviourAwareAcceptance,
  );

  const personalizedValues = comparisons.map(
    (comparison) => comparison.personalizedAcceptance,
  );

  const differences = comparisons.map(
    (comparison) => comparison.acceptanceDifference,
  );

  const sampleSize = differences.length;

  const meanBehaviourAwareAcceptance = mean(behaviourAwareValues);

  const meanPersonalizedAcceptance = mean(personalizedValues);

  const acceptanceDifference = mean(differences);

  const standardDeviationOfDifference = sampleStandardDeviation(differences);

  const standardError =
    sampleSize > 0 ? standardDeviationOfDifference / Math.sqrt(sampleSize) : 0;

  const confidenceIntervalMargin = 1.96 * standardError;

  const confidenceIntervalLower =
    acceptanceDifference - confidenceIntervalMargin;

  const confidenceIntervalUpper =
    acceptanceDifference + confidenceIntervalMargin;

  const acceptanceImprovementPercent =
    meanBehaviourAwareAcceptance !== 0
      ? ((meanPersonalizedAcceptance - meanBehaviourAwareAcceptance) /
          Math.abs(meanBehaviourAwareAcceptance)) *
        100
      : 0;

  const cohensDz =
    standardDeviationOfDifference > 0
      ? acceptanceDifference / standardDeviationOfDifference
      : 0;

  const directionSupportsH4 = sampleSize > 0 && acceptanceDifference > 0;

  let interpretation =
    "Insufficient matched acceptance observations for hypothesis evaluation.";

  if (sampleSize > 0) {
    if (directionSupportsH4) {
      interpretation = `Personalized intervention produced higher mean user acceptance than the Behaviour-Aware baseline by ${acceptanceDifference.toFixed(
        4,
      )}, corresponding to an average acceptance improvement of ${acceptanceImprovementPercent.toFixed(
        2,
      )}%. The observed direction supports H4, but statistical significance must be established with the final inferential test.`;
    } else if (acceptanceDifference < 0) {
      interpretation = `Personalized intervention produced lower mean user acceptance than the Behaviour-Aware baseline by ${Math.abs(
        acceptanceDifference,
      ).toFixed(4)}. The observed direction does not support H4.`;
    } else {
      interpretation =
        "Personalized and Behaviour-Aware interventions produced the same mean user acceptance.";
    }
  }

  return {
    baselineSystem: "behaviour_aware",

    personalizedSystem: "personalized",

    sampleSize,

    meanBehaviourAwareAcceptance,

    meanPersonalizedAcceptance,

    acceptanceDifference,

    acceptanceImprovementPercent,

    standardDeviationOfDifference,

    standardError,

    confidenceIntervalLower,

    confidenceIntervalUpper,

    cohensDz,

    directionSupportsH4,

    interpretation,

    comparisons,
  };
}
