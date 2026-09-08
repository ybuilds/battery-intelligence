import type { InterventionAction } from "../types/intervention";
import type { InterventionCapability } from "../types/intervention-capability";
import { getInterventionCapability } from "../types/intervention-capability";

export type InterventionExecutionResult = {
  action: InterventionAction;
  capability: InterventionCapability;
  executed: boolean;
  executionMode: "execute" | "recommend" | "observe" | "unavailable";
  message: string;
};

export async function executeIntervention(
  action: InterventionAction,
): Promise<InterventionExecutionResult> {
  const capability = getInterventionCapability(action);

  if (action === "no_action") {
    return {
      action,
      capability,
      executed: false,
      executionMode: "observe",
      message: "No intervention was selected.",
    };
  }

  if (capability.mode === "execute") {
    return {
      action,
      capability,
      executed: true,
      executionMode: "execute",
      message: "The intervention was executed by the application.",
    };
  }

  if (capability.mode === "recommend") {
    return {
      action,
      capability,
      executed: false,
      executionMode: "recommend",
      message:
        "The intervention is recommended to the user and requires explicit user control.",
    };
  }

  if (capability.mode === "observe") {
    return {
      action,
      capability,
      executed: false,
      executionMode: "observe",
      message: "The action is being observed without applying an intervention.",
    };
  }

  return {
    action,
    capability,
    executed: false,
    executionMode: "unavailable",
    message: "This intervention is not currently available on the device.",
  };
}
