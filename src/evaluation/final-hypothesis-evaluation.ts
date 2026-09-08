import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentalRecord } from "./experimental-record";

import {
    runPairedBatteryDrainTest,
    type PairedTestResult,
} from "./paired-hypothesis-testing";

import {
    analyzePersonalizationBenefit,
    type PersonalizationAnalysisResult,
} from "./personalization-analysis";

import {
    analyzeUXHypothesis,
    type UXHypothesisResult,
} from "./ux-hypothesis-testing";

import {
    analyzeAcceptance,
    type AcceptanceAnalysisResult,
} from "./acceptance-analysis";

export type HypothesisDecision = "supported" | "not_supported" | "inconclusive";

export type HypothesisEvaluation = {
  hypothesisId: "H1" | "H2" | "H3" | "H4";

  name: string;

  decision: HypothesisDecision;

  sampleSize: number;

  primaryMetric: string;

  observedDirection: "favourable" | "unfavourable" | "neutral";

  statisticallySignificant?: boolean;

  pValue?: number;

  effectSize?: number;

  summary: string;
};

export type MultipleComparisonAdjustment = {
  method: "bonferroni";

  numberOfTests: number;

  originalAlpha: number;

  adjustedAlpha: number;
};

export type FinalHypothesisEvaluation = {
  generatedAt: string;

  sampleSize: number;

  adjustment: MultipleComparisonAdjustment;

  h1: HypothesisEvaluation;

  h2: HypothesisEvaluation;

  h3: HypothesisEvaluation;

  h4: HypothesisEvaluation;

  overallConclusion: string;
};

const ORIGINAL_ALPHA = 0.05;

/*
 * We currently evaluate four research hypotheses.
 *
 * Bonferroni correction:
 *
 * adjusted alpha = alpha / number of tests
 *
 * This is intentionally conservative and easy
 * to explain in a research paper.
 */
function calculateBonferroniAlpha(
  alpha: number,
  numberOfTests: number,
): number {
  if (numberOfTests <= 0) {
    return alpha;
  }

  return alpha / numberOfTests;
}

function evaluateH1(
  result: PairedTestResult,
  adjustedAlpha: number,
): HypothesisEvaluation {
  const significant =
    result.pValue !== undefined ? result.pValue < adjustedAlpha : undefined;

  const favourable = result.meanDifference < 0;

  let decision: HypothesisDecision;

  if (significant === true && favourable) {
    decision = "supported";
  } else if (significant === true && !favourable) {
    decision = "not_supported";
  } else {
    decision = "inconclusive";
  }

  return {
    hypothesisId: "H1",

    name: "Battery Efficiency",

    decision,

    sampleSize: result.sampleSize,

    primaryMetric: "batteryDrainRate",

    observedDirection: favourable
      ? "favourable"
      : result.meanDifference > 0
        ? "unfavourable"
        : "neutral",

    statisticallySignificant: significant,

    pValue: result.pValue,

    effectSize:
      result.sampleSize > 1
        ? result.meanDifference / result.standardDeviationOfDifference
        : undefined,

    summary:
      decision === "supported"
        ? "Personalized intervention shows a statistically significant reduction in measured battery drain rate."
        : decision === "not_supported"
          ? "The observed result does not support the claimed reduction in battery drain rate."
          : "The available evidence is insufficient to establish the claimed battery-efficiency improvement.",
  };
}

function evaluateH2(
  result: PersonalizationAnalysisResult,
  adjustedAlpha: number,
  records: ExperimentalRecord[],
): HypothesisEvaluation {
  const pairedTest = runPairedBatteryDrainTest(
    records,
    "personalized",
    adjustedAlpha,
  );

  const significant =
    pairedTest.pValue !== undefined
      ? pairedTest.pValue < adjustedAlpha
      : undefined;

  const favourable = result.meanDrainRateDifference < 0;

  let decision: HypothesisDecision;

  if (significant === true && favourable) {
    decision = "supported";
  } else if (significant === true && !favourable) {
    decision = "not_supported";
  } else {
    decision = "inconclusive";
  }

  return {
    hypothesisId: "H2",

    name: "Personalization Benefit",

    decision,

    sampleSize: result.sampleSize,

    primaryMetric: "batteryDrainRate",

    observedDirection: favourable
      ? "favourable"
      : result.meanDrainRateDifference > 0
        ? "unfavourable"
        : "neutral",

    statisticallySignificant: significant,

    pValue: pairedTest.pValue,

    effectSize: result.cohensDz,

    summary:
      decision === "supported"
        ? "Personalized Intelligence demonstrates a statistically significant battery-drain reduction compared with the Behaviour-Aware baseline."
        : decision === "not_supported"
          ? "The personalization comparison does not support an improvement over the Behaviour-Aware baseline."
          : "The available evidence is insufficient to establish a statistically significant personalization benefit.",
  };
}

function evaluateH3(
  result: UXHypothesisResult,
  adjustedAlpha: number,
): HypothesisEvaluation {
  /*
   * UX analysis currently provides the
   * matched effect and confidence interval.
   *
   * Until a dedicated validated paired
   * UX test is introduced, the final evaluator
   * treats this as an evidence-direction result.
   */

  const favourable = result.meanDifference < 0;

  const statisticallySignificant = result.confidenceIntervalUpper < 0;

  let decision: HypothesisDecision;

  if (statisticallySignificant && favourable) {
    decision = "supported";
  } else if (result.confidenceIntervalLower > 0) {
    decision = "not_supported";
  } else {
    decision = "inconclusive";
  }

  return {
    hypothesisId: "H3",

    name: "UX Preservation",

    decision,

    sampleSize: result.sampleSize,

    primaryMetric: "uxImpact",

    observedDirection: favourable
      ? "favourable"
      : result.meanDifference > 0
        ? "unfavourable"
        : "neutral",

    statisticallySignificant: statisticallySignificant,

    effectSize: result.cohensDz,

    summary:
      decision === "supported"
        ? "Personalized intervention shows evidence of lower UX impact."
        : decision === "not_supported"
          ? "The observed UX result does not support reduced UX impact."
          : "The available UX evidence is inconclusive.",
  };
}

function evaluateH4(result: AcceptanceAnalysisResult): HypothesisEvaluation {
  const favourable = result.acceptanceDifference > 0;

  /*
   * User acceptance is binary and the current
   * analysis layer does not yet implement a
   * dedicated paired binary statistical test.
   *
   * Therefore H4 is intentionally classified
   * from observed direction only.
   */

  return {
    hypothesisId: "H4",

    name: "User Acceptance",

    decision:
      result.sampleSize === 0
        ? "inconclusive"
        : favourable
          ? "supported"
          : result.acceptanceDifference < 0
            ? "not_supported"
            : "inconclusive",

    sampleSize: result.sampleSize,

    primaryMetric: "userAcceptance",

    observedDirection: favourable
      ? "favourable"
      : result.acceptanceDifference < 0
        ? "unfavourable"
        : "neutral",

    effectSize: result.cohensDz,

    summary:
      result.sampleSize === 0
        ? "No matched acceptance observations are available."
        : favourable
          ? "Observed user acceptance is higher for Personalized Intelligence."
          : result.acceptanceDifference < 0
            ? "Observed user acceptance is lower for Personalized Intelligence."
            : "No observed acceptance difference was found.",
  };
}

function buildOverallConclusion(evaluations: HypothesisEvaluation[]): string {
  const supported = evaluations.filter(
    (evaluation) => evaluation.decision === "supported",
  ).length;

  const inconclusive = evaluations.filter(
    (evaluation) => evaluation.decision === "inconclusive",
  ).length;

  if (supported === evaluations.length) {
    return "All evaluated hypotheses are supported by the current statistical evidence.";
  }

  if (supported > 0 && inconclusive > 0) {
    return `${supported} hypothesis(es) are supported, while ${inconclusive} remain inconclusive. Additional real-device observations are required before drawing a definitive conclusion.`;
  }

  if (supported > 0) {
    return `${supported} hypothesis(es) are supported by the current evidence. Results should be interpreted using the reported effect sizes and confidence intervals.`;
  }

  return "The current evidence is insufficient to establish the research hypotheses.";
}

export function evaluateResearchHypotheses(
  records: ExperimentalRecord[],
): FinalHypothesisEvaluation {
  const numberOfTests = 4;

  const adjustedAlpha = calculateBonferroniAlpha(ORIGINAL_ALPHA, numberOfTests);

  /*
   * H1:
   * Personalized intervention vs matched
   * control.
   */
  const h1Result = runPairedBatteryDrainTest(
    records,
    "personalized",
    adjustedAlpha,
  );

  /*
   * H2:
   * B4 Personalized vs B3 Behaviour-Aware.
   */
  const h2Result = analyzePersonalizationBenefit(records);

  /*
   * H3:
   * Personalized vs Behaviour-Aware UX.
   */
  const h3Result = analyzeUXHypothesis(records);

  /*
   * H4:
   * Personalized vs Behaviour-Aware
   * acceptance.
   */
  const h4Result = analyzeAcceptance(records);

  const h1 = evaluateH1(h1Result, adjustedAlpha);

  const h2 = evaluateH2(h2Result, adjustedAlpha, records);

  const h3 = evaluateH3(h3Result, adjustedAlpha);

  const h4 = evaluateH4(h4Result);

  const evaluations = [h1, h2, h3, h4];

  return {
    generatedAt: new Date().toISOString(),

    sampleSize: records.length,

    adjustment: {
      method: "bonferroni",

      numberOfTests,

      originalAlpha: ORIGINAL_ALPHA,

      adjustedAlpha,
    },

    h1,
    h2,
    h3,
    h4,

    overallConclusion: buildOverallConclusion(evaluations),
  };
}

export const RESEARCH_SYSTEMS: BaselineSystem[] = [
  "battery_only",
  "rule_based",
  "behaviour_aware",
  "personalized",
];
