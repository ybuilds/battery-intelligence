import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentalRecord } from "./experimental-record";
import { calculateMean } from "./statistical-analysis";

export type UXSystemMetrics = {
  system: BaselineSystem;

  uxSampleCount: number;
  meanUXImpact: number;

  acceptanceSampleCount: number;
  acceptanceRate: number;
};

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;

  return Math.round(value * factor) / factor;
}

export function calculateUXMetrics(
  system: BaselineSystem,
  records: ExperimentalRecord[],
): UXSystemMetrics {
  const uxValues = records
    .map((record) => record.uxImpact)
    .filter((value): value is number => value !== undefined);

  const acceptanceValues = records
    .map((record) => record.userAcceptance)
    .filter((value): value is 0 | 1 => value !== undefined);

  return {
    system,

    uxSampleCount: uxValues.length,

    meanUXImpact: round(calculateMean(uxValues)),

    acceptanceSampleCount: acceptanceValues.length,

    acceptanceRate: round(calculateMean(acceptanceValues)),
  };
}
