import type { BaselineSystem } from "../baselines/baseline-types";
import type { ExperimentCondition } from "../types/experiment";
import type { ExperimentalTrial, TrialAllocation } from "../types/trial";

function generateTrialId(): string {
  const timestamp = Date.now().toString(36);

  const random = Math.random().toString(36).slice(2, 8);

  return `trial-${timestamp}-${random}`;
}

export function createTrial(
  system: BaselineSystem,
  condition: ExperimentCondition,
  appName: string,
  startingBatteryLevel: number,
  targetDurationMinutes: number,
  allocation?: Partial<TrialAllocation>,
): ExperimentalTrial {
  return {
    trialId: generateTrialId(),

    system,
    condition,

    appName,

    startingBatteryLevel,
    targetDurationMinutes,

    status: "planned",

    allocation: {
      block: allocation?.block ?? 0,
      repetition: allocation?.repetition ?? 0,
      randomizedOrder: allocation?.randomizedOrder ?? 0,
    },
  };
}
