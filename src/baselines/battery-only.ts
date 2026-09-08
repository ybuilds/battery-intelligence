import type { BatteryState } from "../types/battery";
import type { InterventionAction } from "../types/intervention";
import type { BaselineDecision } from "./baseline-types";

function getBatteryPressure(level: number): number {
  if (level <= 15) return 1;
  if (level <= 30) return 0.75;
  if (level <= 50) return 0.4;

  return 0.1;
}

function selectAction(batteryPressure: number): InterventionAction {
  if (batteryPressure >= 1) {
    return "reduce_brightness";
  }

  if (batteryPressure >= 0.75) {
    return "reduce_brightness";
  }

  if (batteryPressure >= 0.4) {
    return "reduce_brightness";
  }

  return "no_action";
}

export function batteryOnlyBaseline(battery: BatteryState): BaselineDecision {
  const pressure = getBatteryPressure(battery.level);

  const action = selectAction(pressure);

  return {
    system: "battery_only",
    selectedAction: action,
    score: pressure,
    estimatedEnergySaving: action === "reduce_brightness" ? pressure * 10 : 0,
    estimatedUXImpact: action === "reduce_brightness" ? 0.25 : 0,
    reason:
      action === "no_action"
        ? "Battery pressure is insufficient to trigger an intervention."
        : "The intervention is selected using battery level alone.",
  };
}
