import type { BatteryState } from "../types/battery";
import type { AppBehaviour } from "../types/behaviour";
import type { UserEnergyPreferences } from "../types/preferences";

import type { BaselineDecision } from "./baseline-types";

import { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";

export function behaviourAwareBaseline(
  battery: BatteryState,
  behaviour: AppBehaviour,
  predictor: LightweightOutcomePredictor,
): BaselineDecision {
  const neutralPreferences: UserEnergyPreferences = {
    reduce_brightness: {
      accepted: 0,
      rejected: 0,
    },
    reduce_haptics: {
      accepted: 0,
      rejected: 0,
    },
    reduce_audio: {
      accepted: 0,
      rejected: 0,
    },
    limit_background_activity: {
      accepted: 0,
      rejected: 0,
    },
  };

  const candidates = predictor.predictAll(
    battery,
    behaviour,
    neutralPreferences,
    null,
    5,
  );

  if (candidates.length === 0) {
    return {
      system: "behaviour_aware",
      selectedAction: "no_action",
      score: 0,
      estimatedEnergySaving: 0,
      estimatedUXImpact: 0,
      reason: "No behaviour-aware prediction was available.",
    };
  }

  const ranked = [...candidates].sort(
    (a, b) => b.energySaving - b.uxImpact - (a.energySaving - a.uxImpact),
  );

  const selected = ranked[0];

  return {
    system: "behaviour_aware",
    selectedAction: selected.action,
    score: selected.energySaving - selected.uxImpact,
    estimatedEnergySaving: selected.energySaving,
    estimatedUXImpact: selected.uxImpact,
    reason:
      "The intervention is selected using current behavioural characteristics without a personalized historical profile.",
  };
}
