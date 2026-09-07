export type BatteryState = {
  level: number;
  isCharging: boolean;
  lowPowerMode: boolean;
  estimatedMinutesRemaining: number;
};

export type BatteryThresholds = {
  critical: number;
  low: number;
  moderate: number;
};
