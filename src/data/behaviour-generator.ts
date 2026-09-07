import type {
    AppBehaviour,
    AppCategory,
    InteractionIntensity,
    UsageContext,
} from "../types/behaviour";

const appProfiles: {
  appName: string;
  category: AppCategory;
  screenDependency: number;
  audioDependency: number;
  networkDependency: number;
  interactionIntensity: InteractionIntensity;
}[] = [
  {
    appName: "Instagram",
    category: "social",
    screenDependency: 0.95,
    audioDependency: 0.25,
    networkDependency: 0.85,
    interactionIntensity: "high",
  },
  {
    appName: "YouTube",
    category: "video",
    screenDependency: 0.98,
    audioDependency: 0.9,
    networkDependency: 0.95,
    interactionIntensity: "medium",
  },
  {
    appName: "WhatsApp",
    category: "communication",
    screenDependency: 0.65,
    audioDependency: 0.35,
    networkDependency: 0.8,
    interactionIntensity: "high",
  },
  {
    appName: "Spotify",
    category: "music",
    screenDependency: 0.2,
    audioDependency: 0.98,
    networkDependency: 0.75,
    interactionIntensity: "low",
  },
  {
    appName: "Google Maps",
    category: "navigation",
    screenDependency: 0.85,
    audioDependency: 0.55,
    networkDependency: 0.9,
    interactionIntensity: "medium",
  },
  {
    appName: "Safari",
    category: "utilities",
    screenDependency: 0.85,
    audioDependency: 0.15,
    networkDependency: 0.75,
    interactionIntensity: "medium",
  },
  {
    appName: "Notes",
    category: "productivity",
    screenDependency: 0.7,
    audioDependency: 0.05,
    networkDependency: 0.25,
    interactionIntensity: "high",
  },
  {
    appName: "Netflix",
    category: "video",
    screenDependency: 0.99,
    audioDependency: 0.95,
    networkDependency: 0.95,
    interactionIntensity: "low",
  },
  {
    appName: "Kindle",
    category: "reading",
    screenDependency: 0.9,
    audioDependency: 0.05,
    networkDependency: 0.15,
    interactionIntensity: "low",
  },
  {
    appName: "Chess",
    category: "gaming",
    screenDependency: 0.8,
    audioDependency: 0.2,
    networkDependency: 0.5,
    interactionIntensity: "high",
  },
];

const contexts: UsageContext[] = ["morning", "afternoon", "evening", "night"];

function randomBetween(minimum: number, maximum: number): number {
  return minimum + Math.random() * (maximum - minimum);
}

function randomInteger(minimum: number, maximum: number): number {
  return Math.floor(randomBetween(minimum, maximum + 1));
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function generateBehaviourObservation(): AppBehaviour {
  const profile = randomItem(appProfiles);
  const usageContext = randomItem(contexts);

  const typicalSessionDurationMinutes = randomInteger(5, 45);

  const sessionVariation = randomBetween(-0.4, 0.6);

  const sessionDurationMinutes = Math.max(
    1,
    Math.round(typicalSessionDurationMinutes * (1 + sessionVariation)),
  );

  const brightnessVariation = randomBetween(-0.15, 0.15);

  return {
    appName: profile.appName,
    category: profile.category,

    sessionDurationMinutes,

    interactionIntensity: profile.interactionIntensity,

    screenDependency: clamp(
      profile.screenDependency + randomBetween(-0.08, 0.08),
    ),

    audioDependency: clamp(
      profile.audioDependency + randomBetween(-0.08, 0.08),
    ),

    networkDependency: clamp(
      profile.networkDependency + randomBetween(-0.08, 0.08),
    ),

    typicalSessionDurationMinutes,

    preferredBrightness: clamp(0.65 + brightnessVariation),

    usageContext,
  };
}

export function generateBehaviourDataset(count: number): AppBehaviour[] {
  return Array.from({ length: count }, generateBehaviourObservation);
}
