import type { BatteryState } from "../types/battery";
import type { AppBehaviour } from "../types/behaviour";
import type { BehaviourProfile } from "../types/behaviour-profile";
import type { UserEnergyPreferences } from "../types/preferences";
import type {
    Recommendation,
    RecommendationCandidate,
} from "../types/recommendation";

import { getInterventionCapability } from "../types/intervention-capability";

import { LightweightOutcomePredictor } from "./outcome-predictor";

import { optimizeInterventions } from "./intervention-optimizer";

import { calculatePersonalizationPolicy } from "./personalization-policy";

export function generateRecommendation(
  battery: BatteryState,
  behaviour: AppBehaviour,
  preferences: UserEnergyPreferences,
  predictor: LightweightOutcomePredictor,
  profile?: BehaviourProfile | null,
): Recommendation {
  /*
   * The current optimizer accepts the optional
   * optimizer-weights argument, but not the
   * behaviour profile.
   *
   * Profile-aware personalization is already
   * incorporated lower in the intelligence pipeline
   * through feature construction/prediction.
   */
  const optimizedInterventions = optimizeInterventions(
    battery,
    behaviour,
    preferences,
    predictor,
    undefined,
  );

  /*
   * Convert the optimizer's output into the richer
   * RecommendationCandidate representation.
   *
   * Execution capability is deliberately handled
   * here rather than inside the optimizer because
   * optimization and device capability are separate
   * concerns.
   */
  const candidates: RecommendationCandidate[] = optimizedInterventions.map(
    (candidate, index) => {
      const capability = getInterventionCapability(candidate.action);

      return {
        action: candidate.action,

        predictedEnergySaving: candidate.predictedEnergySaving,

        predictedUXImpact: candidate.predictedUXImpact,

        predictedUserAcceptance: candidate.predictedUserAcceptance,

        personalizedPreference: candidate.personalizedPreference,

        utilityScore: candidate.utilityScore,

        confidence: candidate.confidence,

        ranking: index + 1,

        executionMode: capability.mode,

        canExecuteAutomatically: capability.canExecuteAutomatically,
      };
    },
  );

  /*
   * Optimizer results are already ranked.
   * Keep that ranking explicit in the research
   * representation.
   */
  const selected = candidates[0];

  const personalizationPolicy = calculatePersonalizationPolicy(profile);

  const explanation = createRecommendationExplanation(
    selected,
    battery,
    profile,
  );

  return {
    selectedAction: selected?.action ?? "no_action",

    candidates,

    batteryLevel: battery.level,

    profileConfidence: personalizationPolicy.confidence,

    explanation,

    generatedAt: new Date().toISOString(),
  };
}

function createRecommendationExplanation(
  candidate: RecommendationCandidate | undefined,
  battery: BatteryState,
  profile?: BehaviourProfile | null,
): string {
  if (!candidate) {
    return "No intervention is currently recommended.";
  }

  if (candidate.action === "no_action") {
    return "The current battery and behavioural context do not justify a potentially disruptive intervention.";
  }

  const batteryText =
    battery.level <= 15
      ? "Battery pressure is critical."
      : battery.level <= 30
        ? "Battery pressure is high."
        : battery.level <= 50
          ? "Battery pressure is moderate."
          : "Battery pressure is currently low.";

  const actionText = getActionDescription(candidate.action);

  const capabilityText =
    candidate.executionMode === "execute"
      ? " This intervention can be executed automatically."
      : candidate.executionMode === "recommend"
        ? " This intervention requires explicit user control."
        : candidate.executionMode === "observe"
          ? " This intervention is being observed without automatic execution."
          : " This intervention is currently unavailable for automatic execution.";

  const profileText =
    profile && profile.observationCount > 0
      ? ` The recommendation incorporates a behavioural profile containing ${profile.observationCount} historical observation${
          profile.observationCount === 1 ? "" : "s"
        }.`
      : " The recommendation currently relies primarily on general behavioural information because there is insufficient historical profile data.";

  return `${batteryText} ${actionText}${capabilityText}${profileText}`;
}

function getActionDescription(
  action: RecommendationCandidate["action"],
): string {
  switch (action) {
    case "reduce_brightness":
      return "Reducing display brightness has the highest current utility.";

    case "reduce_haptics":
      return "Reducing haptic feedback has the highest current utility.";

    case "reduce_audio":
      return "Reducing audio activity has the highest current utility.";

    case "limit_background_activity":
      return "Limiting background activity has the highest current utility.";

    case "no_action":
      return "No intervention is currently preferred.";
  }
}
