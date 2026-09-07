export type ObservationSource =
  | "real_device"
  | "user_input"
  | "derived"
  | "simulated";

export type ObservationValue<T> = {
  value: T;
  source: ObservationSource;
  recordedAt: string;
};

export type SessionInteractionState = {
  sessionStartedAt: string;
  interactionCount: number;
  activeDurationSeconds: number;
  audioUsed: boolean;
  networkUsed: boolean;
  hapticsUsed: boolean;
};

export type DeviceObservation = {
  batteryLevel: ObservationValue<number>;
  isCharging: ObservationValue<boolean>;
  lowPowerMode: ObservationValue<boolean>;
};

export type BehaviourObservationInput = {
  appName: string;
  category: string;

  sessionDurationMinutes: number;
  interactionIntensity: string;

  screenDependency: number;
  audioDependency: number;
  networkDependency: number;

  typicalSessionDurationMinutes: number;

  preferredBrightness: number;

  usageContext: string;

  source: ObservationSource;
};
