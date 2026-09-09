import type { InterventionExecution } from "../types/intervention-execution";

import { getDatabase } from "./database";

export async function recordInterventionExecution(
  sessionId: string | undefined,
  execution: InterventionExecution,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO intervention_executions (
        session_id,
        intervention_action,
        execution_mode,
        attempted,
        executed,
        before_value,
        after_value,
        execution_parameter,
        error_message,
        executed_at,
        restored,
        restored_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    sessionId ?? null,
    execution.action,
    execution.executionMode,
    execution.attempted ? 1 : 0,
    execution.executed ? 1 : 0,
    execution.beforeValue ?? null,
    execution.afterValue ?? null,
    execution.executionParameter ?? null,
    execution.errorMessage ?? null,
    execution.executedAt,
    execution.restored ? 1 : 0,
    execution.restoredAt ?? null,
  );
}

export async function markInterventionRestored(
  sessionId: string | undefined,
  action: string,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE intervention_executions
     SET restored = 1,
         restored_at = ?
     WHERE intervention_action = ?
       AND (
         session_id = ?
         OR (? IS NULL AND session_id IS NULL)
       )
       AND restored = 0`,
    new Date().toISOString(),
    action,
    sessionId ?? null,
    sessionId ?? null,
  );
}
