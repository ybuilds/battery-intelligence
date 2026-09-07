export type AppCategory =
  | "social"
  | "video"
  | "gaming"
  | "communication"
  | "productivity"
  | "navigation"
  | "music"
  | "reading"
  | "utilities"
  | "other";

export type InteractionIntensity = "low" | "medium" | "high";

export type UsageContext = "morning" | "afternoon" | "evening" | "night";

export type AppBehaviour = {
  appName: string;
  category: AppCategory;

  sessionDurationMinutes: number;

  interactionIntensity: InteractionIntensity;

  screenDependency: number;
  audioDependency: number;
  networkDependency: number;

  typicalSessionDurationMinutes: number;

  preferredBrightness: number;

  usageContext: UsageContext;
};
