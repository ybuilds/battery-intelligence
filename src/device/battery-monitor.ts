import * as Battery from "expo-battery";

import type { BatteryState } from "../types/battery";

export async function getCurrentBatteryState(): Promise<BatteryState> {
  const level = await Battery.getBatteryLevelAsync();

  const batteryState = await Battery.getBatteryStateAsync();

  const lowPowerMode = await Battery.isLowPowerModeEnabledAsync();

  const normalizedLevel = Number.isFinite(level) ? Math.round(level * 100) : 0;

  const isCharging =
    batteryState === Battery.BatteryState.CHARGING ||
    batteryState === Battery.BatteryState.FULL;

  /*
   * iOS does not provide a universally reliable
   * third-party API for exact remaining battery
   * minutes.
   *
   * We therefore leave this value as an estimate
   * rather than presenting it as a measured value.
   */
  const estimatedMinutesRemaining = Math.max(0, normalizedLevel * 3);

  return {
    level: normalizedLevel,
    isCharging,
    lowPowerMode,
    estimatedMinutesRemaining,
  };
}
