export type TrialMeasurement = {
  trialId: string;

  batteryBefore: number;
  batteryAfter: number;

  durationMinutes: number;

  batteryDelta: number;
  batteryDrainRate: number;

  completedAt: string;
};

export function calculateTrialMeasurement(
  trialId: string,
  batteryBefore: number,
  batteryAfter: number,
  durationMinutes: number,
): TrialMeasurement {
  const batteryDelta = batteryBefore - batteryAfter;

  const batteryDrainRate =
    durationMinutes > 0 ? batteryDelta / durationMinutes : 0;

  return {
    trialId,
    batteryBefore,
    batteryAfter,
    durationMinutes,
    batteryDelta,
    batteryDrainRate,
    completedAt: new Date().toISOString(),
  };
}
