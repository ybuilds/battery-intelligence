import {
    getAllBehaviourProfiles,
    getBehaviourProfile,
} from "./behaviour-profile-repository";

import { recordBehaviourObservation } from "./behaviour-repository";

import type { AppBehaviour } from "../types/behaviour";

export async function testBehaviourProfileRepository() {
  const observations: AppBehaviour[] = [
    {
      appName: "Profile Test App",
      category: "social",
      sessionDurationMinutes: 20,
      interactionIntensity: "high",
      screenDependency: 0.9,
      audioDependency: 0.2,
      networkDependency: 0.8,
      typicalSessionDurationMinutes: 20,
      preferredBrightness: 0.7,
      usageContext: "evening",
    },

    {
      appName: "Profile Test App",
      category: "social",
      sessionDurationMinutes: 30,
      interactionIntensity: "medium",
      screenDependency: 0.8,
      audioDependency: 0.1,
      networkDependency: 0.9,
      typicalSessionDurationMinutes: 25,
      preferredBrightness: 0.8,
      usageContext: "evening",
    },

    {
      appName: "Profile Test App",
      category: "social",
      sessionDurationMinutes: 10,
      interactionIntensity: "low",
      screenDependency: 0.6,
      audioDependency: 0,
      networkDependency: 0.7,
      typicalSessionDurationMinutes: 20,
      preferredBrightness: 0.6,
      usageContext: "morning",
    },
  ];

  for (const observation of observations) {
    await recordBehaviourObservation(observation);
  }

  const profile = await getBehaviourProfile("Profile Test App");

  console.log("Generated behaviour profile:");

  console.log(profile);

  const profiles = await getAllBehaviourProfiles();

  console.log("Total behaviour profiles:", profiles.length);
}
