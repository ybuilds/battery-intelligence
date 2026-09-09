
import type { ExperimentalTrial } from "../types/trial";


import type { AppCategory } from "../types/behaviour";

import type { ExperimentalRecord } from "../evaluation/experimental-record";

import { createTrial } from "./trial-generator";

import { buildPersonalizationComparisons } from "../evaluation/personalization-analysis";

export type LongitudinalExperimentConfig = {
  appNames: Array<{
    appName: string;
    category: AppCategory;
  }>;

  blocks: number;

  repetitionsPerBlock: number;

  targetDurationMinutes: number;

  startingBatteryMinimum: number;

  startingBatteryMaximum: number;

  includeControlTrials: boolean;

  randomizeOrder: boolean;
};

export type LongitudinalTrialPair = {
  pairId: string;

  block: number;

  repetition: number;

  appName: string;

  category: AppCategory;

  behaviourAwareTrial: ExperimentalTrial;

  personalizedTrial: ExperimentalTrial;

  randomizedOrder: Array<"behaviour_aware" | "personalized">;
};

export type LongitudinalExperimentPlan = {
  experimentId: string;

  config: LongitudinalExperimentConfig;

  pairs: LongitudinalTrialPair[];

  totalTrials: number;

  totalMatchedPairs: number;
};

export type LongitudinalTrajectoryPoint = {
  pairId: string;

  appName: string;

  block: number;

  repetition: number;

  behaviourAwareCompleted: boolean;

  personalizedCompleted: boolean;

  profileObservationCount: number;

  profileConfidence: number;

  behaviourAwareDrainRate?: number;

  personalizedDrainRate?: number;

  drainRateDifference?: number;

  improvementPercent?: number;
};

export type LongitudinalAnalysis = {
  experimentId: string;

  totalPairs: number;

  completedPairs: number;

  completionRate: number;

  trajectory: LongitudinalTrajectoryPoint[];

  meanDrainRateDifference: number;

  meanImprovementPercent: number;

  actionChangeRate?: number;

  interpretation: string;
};

function generateExperimentId(): string {
  const timestamp = Date.now().toString(36);

  const random = Math.random().toString(36).slice(2, 8);

  return `longitudinal-${timestamp}-${random}`;
}

function generatePairId(
  experimentId: string,
  block: number,
  repetition: number,
  appName: string,
): string {
  return [experimentId, block, repetition, appName].join("-");
}

function randomInteger(minimum: number, maximum: number): number {
  if (maximum <= minimum) {
    return minimum;
  }

  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function createRandomOrder(
  randomize: boolean,
): Array<"behaviour_aware" | "personalized"> {
  if (!randomize) {
    return ["behaviour_aware", "personalized"];
  }

  return Math.random() < 0.5
    ? ["behaviour_aware", "personalized"]
    : ["personalized", "behaviour_aware"];
}

function validateConfig(config: LongitudinalExperimentConfig): void {
  if (config.appNames.length === 0) {
    throw new Error(
      "At least one application is required for the longitudinal experiment.",
    );
  }

  if (config.blocks <= 0) {
    throw new Error(
      "The longitudinal experiment must contain at least one block.",
    );
  }

  if (config.repetitionsPerBlock <= 0) {
    throw new Error("Each block must contain at least one repetition.");
  }

  if (config.targetDurationMinutes <= 0) {
    throw new Error("Target duration must be greater than zero.");
  }

  if (
    config.startingBatteryMinimum < 0 ||
    config.startingBatteryMaximum > 100 ||
    config.startingBatteryMinimum > config.startingBatteryMaximum
  ) {
    throw new Error(
      "Starting battery bounds must be within 0–100 and minimum must not exceed maximum.",
    );
  }
}

export function createDefaultLongitudinalConfig(): LongitudinalExperimentConfig {
  return {
    appNames: [
      {
        appName: "Instagram",
        category: "social",
      },
      {
        appName: "YouTube",
        category: "video",
      },
      {
        appName: "WhatsApp",
        category: "communication",
      },
      {
        appName: "Spotify",
        category: "music",
      },
    ],

    blocks: 5,

    repetitionsPerBlock: 2,

    targetDurationMinutes: 20,

    startingBatteryMinimum: 20,

    startingBatteryMaximum: 50,

    includeControlTrials: true,

    randomizeOrder: true,
  };
}

export function createLongitudinalExperimentPlan(
  config: LongitudinalExperimentConfig = createDefaultLongitudinalConfig(),
): LongitudinalExperimentPlan {
  validateConfig(config);

  const experimentId = generateExperimentId();

  const pairs: LongitudinalTrialPair[] = [];

  for (let block = 1; block <= config.blocks; block += 1) {
    for (
      let repetition = 1;
      repetition <= config.repetitionsPerBlock;
      repetition += 1
    ) {
      for (const app of config.appNames) {
        const pairId = generatePairId(
          experimentId,
          block,
          repetition,
          app.appName,
        );

        const startingBatteryLevel = randomInteger(
          config.startingBatteryMinimum,
          config.startingBatteryMaximum,
        );

        const randomizedOrder = createRandomOrder(config.randomizeOrder);

        const behaviourAwareTrial = createTrial(
          "behaviour_aware",
          "intervention",
          app.appName,
          startingBatteryLevel,
          config.targetDurationMinutes,
          {
            block,
            repetition,
            randomizedOrder: randomizedOrder.indexOf("behaviour_aware") + 1,
          },
        );

        const personalizedTrial = createTrial(
          "personalized",
          "intervention",
          app.appName,
          startingBatteryLevel,
          config.targetDurationMinutes,
          {
            block,
            repetition,
            randomizedOrder: randomizedOrder.indexOf("personalized") + 1,
          },
        );

        pairs.push({
          pairId,

          block,

          repetition,

          appName: app.appName,

          category: app.category,

          behaviourAwareTrial,

          personalizedTrial,

          randomizedOrder,
        });
      }
    }
  }

  const trialsPerPair = config.includeControlTrials ? 2 : 2;

  return {
    experimentId,

    config,

    pairs,

    totalTrials: pairs.length * trialsPerPair,

    totalMatchedPairs: pairs.length,
  };
}

export function flattenLongitudinalTrials(
  plan: LongitudinalExperimentPlan,
): ExperimentalTrial[] {
  const trials: ExperimentalTrial[] = [];

  for (const pair of plan.pairs) {
    if (pair.randomizedOrder[0] === "behaviour_aware") {
      trials.push(pair.behaviourAwareTrial);

      trials.push(pair.personalizedTrial);
    } else {
      trials.push(pair.personalizedTrial);

      trials.push(pair.behaviourAwareTrial);
    }
  }

  return trials;
}

function createRecordLookup(
  records: ExperimentalRecord[],
): Map<string, ExperimentalRecord> {
  const lookup = new Map<string, ExperimentalRecord>();

  for (const record of records) {
    const key = [
      record.appName,
      record.block,
      record.repetition,
      record.system,
      record.condition,
    ].join("|");

    lookup.set(key, record);
  }

  return lookup;
}

function calculateMean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function analyzeLongitudinalExperiment(
  plan: LongitudinalExperimentPlan,
  records: ExperimentalRecord[],
  profileConfidenceByPair?: Map<
    string,
    {
      observationCount: number;
      profileConfidence: number;
    }
  >,
): LongitudinalAnalysis {
  const lookup = createRecordLookup(records);

  const personalizationComparisons = buildPersonalizationComparisons(records);

  const comparisonLookup = new Map<
    string,
    (typeof personalizationComparisons)[number]
  >();

  for (const comparison of personalizationComparisons) {
    const key = [
      comparison.appName,
      comparison.block,
      comparison.repetition,
    ].join("|");

    comparisonLookup.set(key, comparison);
  }

  const trajectory: LongitudinalTrajectoryPoint[] = [];

  for (const pair of plan.pairs) {
    const behaviourAwareKey = [
      pair.appName,
      pair.block,
      pair.repetition,
      "behaviour_aware",
      "intervention",
    ].join("|");

    const personalizedKey = [
      pair.appName,
      pair.block,
      pair.repetition,
      "personalized",
      "intervention",
    ].join("|");

    const behaviourAwareRecord = lookup.get(behaviourAwareKey);

    const personalizedRecord = lookup.get(personalizedKey);

    const comparisonKey = [pair.appName, pair.block, pair.repetition].join("|");

    const comparison = comparisonLookup.get(comparisonKey);

    const profileState = profileConfidenceByPair?.get(pair.pairId);

    trajectory.push({
      pairId: pair.pairId,

      appName: pair.appName,

      block: pair.block,

      repetition: pair.repetition,

      behaviourAwareCompleted: behaviourAwareRecord !== undefined,

      personalizedCompleted: personalizedRecord !== undefined,

      profileObservationCount: profileState?.observationCount ?? 0,

      profileConfidence: profileState?.profileConfidence ?? 0,

      behaviourAwareDrainRate: behaviourAwareRecord?.batteryDrainRate,

      personalizedDrainRate: personalizedRecord?.batteryDrainRate,

      drainRateDifference: comparison?.drainRateDifference,

      improvementPercent: comparison?.improvementPercent,
    });
  }

  const completedPairs = trajectory.filter(
    (point) => point.behaviourAwareCompleted && point.personalizedCompleted,
  );

  const completionRate =
    plan.totalMatchedPairs > 0
      ? completedPairs.length / plan.totalMatchedPairs
      : 0;

  const differences = completedPairs
    .map((point) => point.drainRateDifference)
    .filter((value): value is number => value !== undefined);

  const improvements = completedPairs
    .map((point) => point.improvementPercent)
    .filter((value): value is number => value !== undefined);

  const meanDrainRateDifference = calculateMean(differences);

  const meanImprovementPercent = calculateMean(improvements);

  let interpretation =
    "No completed matched B3/B4 intervention pairs are available.";

  if (completedPairs.length > 0) {
    if (meanDrainRateDifference < 0) {
      interpretation = `Across ${completedPairs.length} completed matched pairs, Personalized Intelligence produced a lower mean battery drain rate than the Behaviour-Aware baseline. This describes the observed direction only; inferential testing should be performed using the final hypothesis-evaluation pipeline.`;
    } else if (meanDrainRateDifference > 0) {
      interpretation = `Across ${completedPairs.length} completed matched pairs, Personalized Intelligence produced a higher mean battery drain rate than the Behaviour-Aware baseline. The observed direction does not favour the personalization hypothesis.`;
    } else {
      interpretation =
        "Across the completed matched pairs, Personalized Intelligence and the Behaviour-Aware baseline had the same mean battery drain rate.";
    }
  }

  return {
    experimentId: plan.experimentId,

    totalPairs: plan.totalMatchedPairs,

    completedPairs: completedPairs.length,

    completionRate,

    trajectory,

    meanDrainRateDifference,

    meanImprovementPercent,

    interpretation,
  };
}

export function printLongitudinalPlan(plan: LongitudinalExperimentPlan): void {
  console.log("\n========================================");

  console.log("LONGITUDINAL EXPERIMENT PLAN");

  console.log("========================================");

  console.log({
    experimentId: plan.experimentId,

    applications: plan.config.appNames.length,

    blocks: plan.config.blocks,

    repetitionsPerBlock: plan.config.repetitionsPerBlock,

    matchedPairs: plan.totalMatchedPairs,

    totalTrials: plan.totalTrials,

    targetDurationMinutes: plan.config.targetDurationMinutes,

    batteryRange: `${plan.config.startingBatteryMinimum}%–${plan.config.startingBatteryMaximum}%`,

    randomizedOrder: plan.config.randomizeOrder,
  });

  console.log("\nMatched trial pairs:");

  for (const pair of plan.pairs) {
    console.log({
      pairId: pair.pairId,

      app: pair.appName,

      block: pair.block,

      repetition: pair.repetition,

      order: pair.randomizedOrder,

      behaviourAwareTrial: pair.behaviourAwareTrial.trialId,

      personalizedTrial: pair.personalizedTrial.trialId,
    });
  }
}

export function printLongitudinalAnalysis(
  analysis: LongitudinalAnalysis,
): void {
  console.log("\n========================================");

  console.log("LONGITUDINAL EXPERIMENT ANALYSIS");

  console.log("========================================");

  console.log({
    experimentId: analysis.experimentId,

    totalPairs: analysis.totalPairs,

    completedPairs: analysis.completedPairs,

    completionRate: `${(analysis.completionRate * 100).toFixed(1)}%`,

    meanDrainRateDifference: analysis.meanDrainRateDifference.toFixed(6),

    meanImprovementPercent: analysis.meanImprovementPercent.toFixed(2),

    interpretation: analysis.interpretation,
  });

  console.log("\nPersonalization trajectory:");

  for (const point of analysis.trajectory) {
    console.log({
      app: point.appName,

      block: point.block,

      repetition: point.repetition,

      observations: point.profileObservationCount,

      profileConfidence: Number(point.profileConfidence.toFixed(4)),

      B3Completed: point.behaviourAwareCompleted,

      B4Completed: point.personalizedCompleted,

      B3DrainRate: point.behaviourAwareDrainRate,

      B4DrainRate: point.personalizedDrainRate,

      B4MinusB3: point.drainRateDifference,

      improvement: point.improvementPercent,
    });
  }
}
