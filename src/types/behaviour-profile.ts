import type {
    AppCategory,
    InteractionIntensity,
    UsageContext,
} from "./behaviour";

export type ContextDistribution = {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
};

export type BehaviourProfile = {
  appName: string;

  category: AppCategory;

  observationCount: number;

  averageSessionDurationMinutes: number;

  averageScreenDependency: number;

  averageAudioDependency: number;

  averageNetworkDependency: number;

  averagePreferredBrightness: number;

  dominantInteractionIntensity: InteractionIntensity;

  contextDistribution: ContextDistribution;

  dominantContext: UsageContext;

  profileConfidence: number;

  firstObservedAt: string;

  lastObservedAt: string;
};
