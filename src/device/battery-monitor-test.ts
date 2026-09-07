import { getCurrentBatteryState } from "./battery-monitor";

export async function testBatteryMonitor() {
  const battery = await getCurrentBatteryState();

  console.log("Real device battery state:");

  console.log({
    level: battery.level,

    isCharging: battery.isCharging,

    lowPowerMode: battery.lowPowerMode,

    estimatedMinutesRemaining: battery.estimatedMinutesRemaining,
  });
}
