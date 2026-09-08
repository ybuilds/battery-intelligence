import type { BaselineSystem } from "../baselines/baseline-types";
import type { InterventionMeasurementResult } from "../experiments/experiment-controller";
import type { ExperimentCondition } from "../types/experiment";
import type { ExperimentalTrial } from "../types/trial";
import type { ExperimentalRecord } from "./experimental-record";

export type ExperimentalRecordInput = {
  trialId: string;

  system: BaselineSystem;
  condition: ExperimentCondition;

  appName: string;

  block: number;
  repetition: number;

  batteryBefore: number;
  batteryAfter: number;

  durationMinutes: number;

  uxImpact?: number;
  userAcceptance?: 0 | 1;

  recordedAt?: string;
};

export function buildExperimentalRecord(
  input: ExperimentalRecordInput,
): ExperimentalRecord {
  const batteryDelta = input.batteryBefore - input.batteryAfter;

  const batteryDrainRate =
    input.durationMinutes > 0 ? batteryDelta / input.durationMinutes : 0;

  return {
    trialId: input.trialId,

    system: input.system,
    condition: input.condition,

    appName: input.appName,

    block: input.block,
    repetition: input.repetition,

    batteryBefore: input.batteryBefore,
    batteryAfter: input.batteryAfter,

    durationMinutes: input.durationMinutes,

    batteryDelta,
    batteryDrainRate,

    uxImpact: input.uxImpact,
    userAcceptance: input.userAcceptance,

    recordedAt: input.recordedAt ?? new Date().toISOString(),
  };
}

export function buildExperimentalRecordFromMeasurement(
  trial: ExperimentalTrial,
  measurement: InterventionMeasurementResult,
): ExperimentalRecord {
  return buildExperimentalRecord({
    trialId: trial.trialId,

    system: trial.system,
    condition: trial.condition,

    appName: trial.appName,

    block: trial.allocation.block,
    repetition: trial.allocation.repetition,

    batteryBefore: measurement.batteryBefore,

    batteryAfter: measurement.batteryAfter,

    durationMinutes: measurement.measuredDurationMinutes,

    userAcceptance: measurement.userAcceptance,

    recordedAt: new Date().toISOString(),
  });
}
