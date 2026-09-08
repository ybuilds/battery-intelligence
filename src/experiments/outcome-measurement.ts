export type BatteryMeasurement = {
  batteryLevel: number;
  measuredAt: string;
};

export type BatteryChangeMeasurement = {
  batteryBefore: BatteryMeasurement;
  batteryAfter: BatteryMeasurement;
  batteryDelta: number;
  durationMinutes: number;
};

export function calculateBatteryChange(
  batteryBefore: BatteryMeasurement,
  batteryAfter: BatteryMeasurement,
): BatteryChangeMeasurement {
  const beforeTime = new Date(batteryBefore.measuredAt).getTime();

  const afterTime = new Date(batteryAfter.measuredAt).getTime();

  const durationMinutes = Math.max(0, (afterTime - beforeTime) / 60000);

  return {
    batteryBefore,
    batteryAfter,
    batteryDelta: batteryBefore.batteryLevel - batteryAfter.batteryLevel,
    durationMinutes,
  };
}

export function calculateBatteryDrainRate(
  measurement: BatteryChangeMeasurement,
): number {
  if (measurement.durationMinutes <= 0) {
    return 0;
  }

  return measurement.batteryDelta / measurement.durationMinutes;
}
