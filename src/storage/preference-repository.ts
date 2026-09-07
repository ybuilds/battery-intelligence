import type { InterventionAction } from "../types/intervention";
import type { UserEnergyPreferences } from "../types/preferences";
import { getDatabase } from "./database";

const ACTIONS: InterventionAction[] = [
  "reduce_brightness",
  "reduce_haptics",
  "reduce_audio",
  "limit_background_activity",
];

export async function initializePreferences(): Promise<void> {
  const db = await getDatabase();

  const now = new Date().toISOString();

  for (const action of ACTIONS) {
    await db.runAsync(
      `
      INSERT OR IGNORE INTO user_preferences
      (action, accepted_count, rejected_count, updated_at)
      VALUES (?, 0, 0, ?)
      `,
      action,
      now,
    );
  }
}

export async function loadPreferences(): Promise<UserEnergyPreferences> {
  const db = await getDatabase();

  await initializePreferences();

  const rows = await db.getAllAsync<{
    action: InterventionAction;
    accepted_count: number;
    rejected_count: number;
  }>(
    `
    SELECT action, accepted_count, rejected_count
    FROM user_preferences
    `,
  );

  const preferences: UserEnergyPreferences = {
    reduce_brightness: {
      accepted: 0,
      rejected: 0,
    },
    reduce_haptics: {
      accepted: 0,
      rejected: 0,
    },
    reduce_audio: {
      accepted: 0,
      rejected: 0,
    },
    limit_background_activity: {
      accepted: 0,
      rejected: 0,
    },
  };

  for (const row of rows) {
    if (row.action === "no_action") {
      continue;
    }

    preferences[row.action] = {
      accepted: row.accepted_count,
      rejected: row.rejected_count,
    };
  }

  return preferences;
}

export async function recordPreferenceDecision(
  action: InterventionAction,
  decision: "accepted" | "rejected",
): Promise<void> {
  if (action === "no_action") {
    return;
  }

  const db = await getDatabase();

  const column = decision === "accepted" ? "accepted_count" : "rejected_count";

  await db.runAsync(
    `
    UPDATE user_preferences
    SET ${column} = ${column} + 1,
        updated_at = ?
    WHERE action = ?
    `,
    new Date().toISOString(),
    action,
  );
}
