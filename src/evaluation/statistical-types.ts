import type { BaselineSystem } from "../baselines/baseline-types";

export type StatisticalSummary = {
  system: BaselineSystem;

  sampleCount: number;

  mean: number;

  standardDeviation: number;

  standardError: number;

  minimum: number;

  maximum: number;
};

export type SystemComparison = {
  systemA: BaselineSystem;
  systemB: BaselineSystem;

  meanDifference: number;

  effectDirection: "higher" | "lower" | "equal";
};
