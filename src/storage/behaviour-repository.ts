import type { AppBehaviour } from "../types/behaviour";
import { getDatabase } from "./database";

export async function recordBehaviourObservation(
  behaviour: AppBehaviour,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
    INSERT INTO behaviour_observations (
      app_name,
      category,
      session_duration_minutes,
      interaction_intensity,
      screen_dependency,
      audio_dependency,
      network_dependency,
      typical_session_duration_minutes,
      preferred_brightness,
      usage_context,
      recorded_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    behaviour.appName,
    behaviour.category,
    behaviour.sessionDurationMinutes,
    behaviour.interactionIntensity,
    behaviour.screenDependency,
    behaviour.audioDependency,
    behaviour.networkDependency,
    behaviour.typicalSessionDurationMinutes,
    behaviour.preferredBrightness,
    behaviour.usageContext,
    new Date().toISOString(),
  );
}
