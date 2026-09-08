import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentalRecord } from "./experimental-record";

export type UXHypothesisResult = {
  baselineSystem: BaselineSystem;
  personalizedSystem: BaselineSystem;

  sampleSize: number;

  meanBaselineUXImpact: number;
  meanPersonalizedUXImpact: number;

  meanDifference: number;

  meanImprovementPercent: number;

  standardDeviationOfDifference: number;

  standardError: number;

  confidenceIntervalLower: number;
  confidenceIntervalUpper: number;

  cohensDz: number;

  directionSupportsH3: boolean;

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

  const squaredDifferences = values.reduce(
    (sum, value) => sum + Math.pow(value - average, 2),
    0,
  );

  return Math.sqrt(squaredDifferences / (values.length - 1));
}

type MatchedUXPair = {
  baselineUXImpact: number;
  personalizedUXImpact: number;
};

function buildMatchedUXPairs(records: ExperimentalRecord[]): MatchedUXPair[] {
  const eligibleRecords = records.filter(
    (record) =>
      record.condition === "intervention" &&
      (record.system === "behaviour_aware" ||
        record.system === "personalized") &&
      typeof record.uxImpact === "number" &&
      Number.isFinite(record.uxImpact),
  );

  const groups = new Map<string, ExperimentalRecord[]>();

  for (const record of eligibleRecords) {
    const key = [record.appName, record.block, record.repetition].join("|");

    const existing = groups.get(key) ?? [];

    existing.push(record);

    groups.set(key, existing);
  }

  const pairs: MatchedUXPair[] = [];

  for (const group of groups.values()) {
    const baseline = group.find(
      (record) => record.system === "behaviour_aware",
    );

    const personalized = group.find(
      (record) => record.system === "personalized",
    );

    if (
      !baseline ||
      !personalized ||
      baseline.uxImpact === undefined ||
      personalized.uxImpact === undefined
    ) {
      continue;
    }

    pairs.push({
      baselineUXImpact: baseline.uxImpact,

      personalizedUXImpact: personalized.uxImpact,
    });
  }

  return pairs;
}

export function analyzeUXHypothesis(
  records: ExperimentalRecord[],
): UXHypothesisResult {
  const pairs = buildMatchedUXPairs(records);

  const baselineValues = pairs.map((pair) => pair.baselineUXImpact);

  const personalizedValues = pairs.map((pair) => pair.personalizedUXImpact);

  /*
   * Difference is:
   *
   * Personalized UX − Behaviour-Aware UX
   *
   * Negative means personalized
   * intervention has lower UX impact.
   */

  const differences = pairs.map(
    (pair) => pair.personalizedUXImpact - pair.baselineUXImpact,
  );

  const sampleSize = differences.length;

  const meanBaselineUXImpact = mean(baselineValues);

  const meanPersonalizedUXImpact = mean(personalizedValues);

  const meanDifference = mean(differences);

  const standardDeviationOfDifference = sampleStandardDeviation(differences);

  const standardError =
    sampleSize > 0 ? standardDeviationOfDifference / Math.sqrt(sampleSize) : 0;

  const confidenceIntervalMargin = 1.96 * standardError;

  const confidenceIntervalLower = meanDifference - confidenceIntervalMargin;

  const confidenceIntervalUpper = meanDifference + confidenceIntervalMargin;

  const meanImprovementPercent =
    meanBaselineUXImpact !== 0
      ? ((meanBaselineUXImpact - meanPersonalizedUXImpact) /
          Math.abs(meanBaselineUXImpact)) *
        100
      : 0;

  const cohensDz =
    standardDeviationOfDifference > 0
      ? meanDifference / standardDeviationOfDifference
      : 0;

  const directionSupportsH3 = sampleSize > 0 && meanDifference < 0;

  let interpretation =
    "Insufficient matched UX observations for hypothesis evaluation.";

  if (sampleSize > 0) {
    if (directionSupportsH3) {
      interpretation = `Personalized intervention produced lower mean UX impact than the Behaviour-Aware baseline by ${Math.abs(
        meanDifference,
      ).toFixed(
        4,
      )}, corresponding to an average UX-impact improvement of ${meanImprovementPercent.toFixed(
        2,
      )}%. The observed direction supports H3, but statistical significance must be established with the final inferential test.`;
    } else if (meanDifference > 0) {
      interpretation = `Personalized intervention produced higher mean UX impact than the Behaviour-Aware baseline by ${meanDifference.toFixed(
        4,
      )}. The observed direction does not support H3.`;
    } else {
      interpretation =
        "Personalized and Behaviour-Aware interventions produced the same mean UX impact.";
    }
  }

  return {
    baselineSystem: "behaviour_aware",

    personalizedSystem: "personalized",

    sampleSize,

    meanBaselineUXImpact,

    meanPersonalizedUXImpact,

    meanDifference,

    meanImprovementPercent,

    standardDeviationOfDifference,

    standardError,

    confidenceIntervalLower,

    confidenceIntervalUpper,

    cohensDz,

    directionSupportsH3,

    interpretation,
  };
}
