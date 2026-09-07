export type ExperimentSession = {
  sessionId: string;

  startedAt: string;

  appName: string;

  batteryLevelAtStart: number;

  selectedAction: string;

  userDecision: "accepted" | "rejected" | "ignored" | "pending";

  completedAt?: string;
};

export type InterventionOutcomeMeasurement = {
  sessionId: string;

  batteryLevelBefore: number;
  batteryLevelAfter?: number;

  energySaving?: number;

  uxImpact?: number;

  userAcceptance: 0 | 1 | undefined;

  measuredDurationMinutes?: number;

  recordedAt: string;
};
