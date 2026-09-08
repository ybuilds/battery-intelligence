import type { InterventionAction } from "./intervention";

export type InterventionExecutionMode =
  | "execute"
  | "recommend"
  | "observe"
  | "unavailable";

export type InterventionCapability = {
  action: InterventionAction;
  mode: InterventionExecutionMode;
  canExecuteAutomatically: boolean;
  description: string;
  researchNote: string;
};

export const INTERVENTION_CAPABILITIES: InterventionCapability[] = [
  {
    action: "reduce_brightness",
    mode: "recommend",
    canExecuteAutomatically: false,
    description:
      "Brightness reduction can be recommended to the user, but the application should not assume unrestricted system-wide brightness control.",
    researchNote:
      "Evaluate brightness-related energy effects through controlled user experiments and supported application behaviour.",
  },
  {
    action: "reduce_haptics",
    mode: "recommend",
    canExecuteAutomatically: false,
    description:
      "The application can modify haptic behaviour that it owns, but should not assume arbitrary system-wide haptic control.",
    researchNote:
      "Measure user acceptance and UX impact of reduced haptic feedback where application-level control exists.",
  },
  {
    action: "reduce_audio",
    mode: "recommend",
    canExecuteAutomatically: false,
    description:
      "Audio behaviour is dependent on the application's audio session and supported controls.",
    researchNote:
      "Evaluate audio-related interventions within application-controlled audio contexts.",
  },
  {
    action: "limit_background_activity",
    mode: "recommend",
    canExecuteAutomatically: false,
    description:
      "A third-party application should not assume that it can arbitrarily terminate or throttle other applications' background activity.",
    researchNote:
      "Treat this action primarily as a recommendation and investigate measurable effects through supported application behaviour.",
  },
  {
    action: "no_action",
    mode: "observe",
    canExecuteAutomatically: false,
    description: "No intervention is applied.",
    researchNote:
      "Useful as a control condition for evaluating whether intervention is justified.",
  },
];

export function getInterventionCapability(
  action: InterventionAction,
): InterventionCapability {
  return (
    INTERVENTION_CAPABILITIES.find(
      (capability) => capability.action === action,
    ) ?? {
      action,
      mode: "unavailable",
      canExecuteAutomatically: false,
      description: "No capability information is available for this action.",
      researchNote:
        "Treat this action as unavailable until explicitly validated.",
    }
  );
}
