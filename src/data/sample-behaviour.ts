import type { AppBehaviour } from "../types/behaviour";

export const sampleBehaviour: AppBehaviour = {
  appName: "Instagram",

  category: "social",

  sessionDurationMinutes: 18,

  interactionIntensity: "high",

  screenDependency: 0.95,

  audioDependency: 0.25,

  networkDependency: 0.85,

  typicalSessionDurationMinutes: 22,

  preferredBrightness: 0.75,

  usageContext: "evening",
};
