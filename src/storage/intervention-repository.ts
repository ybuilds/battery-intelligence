import type { BatteryState } from "../types/battery";
import type { Intervention, UserDecision } from "../types/intervention";
import { getDatabase } from "./database";

export async function recordInterventionEvent(
  battery: BatteryState,
  intervention: Intervention,
  decision: UserDecision,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO intervention_events (
        battery_level,
        intervention_action,
        estimated_battery_saving,
        estimated_ux_impact,
        confidence,
        user_decision,
        recorded_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    battery.level,
    intervention.action,
    intervention.estimatedBatterySaving,
    intervention.estimatedUXImpact,
    intervention.confidence,
    decision,
    new Date().toISOString(),
  );
}
