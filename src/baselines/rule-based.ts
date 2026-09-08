import type { BatteryState } from "../types/battery";
import type { AppBehaviour } from "../types/behaviour";
import type { BaselineDecision } from "./baseline-types";

function getBatteryPressure(level: number): number {
  if (level <= 15) return 1;
  if (level <= 30) return 0.75;
  if (level <= 50) return 0.4;

  return 0.1;
}

export function ruleBasedBaseline(
  battery: BatteryState,
  behaviour: AppBehaviour,
): BaselineDecision {
  const pressure = getBatteryPressure(battery.level);

  if (pressure >= 0.75 && behaviour.screenDependency >= 0.7) {
    return {
      system: "rule_based",
      selectedAction: "reduce_brightness",
      score: pressure * behaviour.screenDependency,
      estimatedEnergySaving: 10,
      estimatedUXImpact: 0.25,
      reason:
        "High battery pressure combined with high screen dependency triggers brightness reduction.",
    };
  }

  if (pressure >= 0.75 && behaviour.interactionIntensity === "high") {
    return {
      system: "rule_based",
      selectedAction: "reduce_haptics",
      score: pressure * 0.8,
      estimatedEnergySaving: 3,
      estimatedUXImpact: 0.1,
      reason:
        "High battery pressure and high interaction intensity trigger haptic reduction.",
    };
  }

  if (pressure >= 0.4 && behaviour.audioDependency >= 0.6) {
    return {
      system: "rule_based",
      selectedAction: "reduce_audio",
      score: pressure * behaviour.audioDependency,
      estimatedEnergySaving: 4,
      estimatedUXImpact: 0.2,
      reason:
        "Audio dependency is sufficiently high under moderate battery pressure.",
    };
  }

  if (pressure >= 0.4 && behaviour.networkDependency >= 0.7) {
    return {
      system: "rule_based",
      selectedAction: "limit_background_activity",
      score: pressure * behaviour.networkDependency,
      estimatedEnergySaving: 6,
      estimatedUXImpact: 0.35,
      reason:
        "High network dependency under battery pressure triggers background activity reduction.",
    };
  }

  return {
    system: "rule_based",
    selectedAction: "no_action",
    score: 0,
    estimatedEnergySaving: 0,
    estimatedUXImpact: 0,
    reason:
      "No predefined rule was sufficiently strong to justify an intervention.",
  };
}
