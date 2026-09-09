import type { InterventionAction } from "../types/intervention";

import type { InterventionExecution } from "../types/intervention-execution";

import { IOS_INTERVENTION_CAPABILITIES } from "../types/intervention-capability";

import { reduceBrightness, restoreBrightness } from "./brightness-controller";

export async function executeIntervention(
  action: InterventionAction,
): Promise<InterventionExecution> {
  const capability = IOS_INTERVENTION_CAPABILITIES[action];

  const executedAt = new Date().toISOString();

  if (capability.executionMode !== "execute") {
    return {
      action,
      executionMode: capability.executionMode,
      attempted: false,
      executed: false,
      executedAt,
      restored: false,
    };
  }

  try {
    if (action === "reduce_brightness") {
      const result = await reduceBrightness(0.2);

      return {
        action,
        executionMode: "execute",
        attempted: true,
        executed: true,
        beforeValue: result.before,
        afterValue: result.after,
        executionParameter: result.reductionFraction,
        executedAt,
        restored: false,
      };
    }

    return {
      action,
      executionMode: capability.executionMode,
      attempted: true,
      executed: false,
      executedAt,
      restored: false,
      errorMessage:
        "No executable implementation is registered for this action.",
    };
  } catch (error) {
    return {
      action,
      executionMode: capability.executionMode,
      attempted: true,
      executed: false,
      executedAt,
      restored: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function restoreIntervention(
  execution: InterventionExecution,
): Promise<InterventionExecution> {
  if (!execution.executed) {
    return execution;
  }

  if (
    execution.action === "reduce_brightness" &&
    execution.beforeValue !== undefined
  ) {
    await restoreBrightness(execution.beforeValue);

    return {
      ...execution,
      restored: true,
      restoredAt: new Date().toISOString(),
    };
  }

  return {
    ...execution,
    restored: true,
    restoredAt: new Date().toISOString(),
  };
}
