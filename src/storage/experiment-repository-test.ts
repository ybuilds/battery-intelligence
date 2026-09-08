import {
  createExperimentSession,
  recordOutcomeMeasurement,
  updateExperimentDecision,
} from "./experiment-repository";

import { generateSessionId } from "../utils/session-id";

export async function testExperimentRepository() {
  const sessionId = generateSessionId();

  const startedAt = new Date().toISOString();

  await createExperimentSession({
    sessionId,

    startedAt,

    appName: "Instagram",

    batteryLevelAtStart: 34,

    selectedAction: "reduce_brightness",

    userDecision: "pending",

    condition: "intervention",

    trialId: "test-trial",

    system: "personalized",
  });

  console.log("Created experiment session:", sessionId);

  await updateExperimentDecision(sessionId, "accepted");

  console.log("Recorded user decision.");

  await recordOutcomeMeasurement({
    sessionId,

    batteryLevelBefore: 34,

    batteryLevelAfter: 32,

    energySaving: 0.12,

    uxImpact: 0.08,

    userAcceptance: 1,

    measuredDurationMinutes: 10,

    recordedAt: new Date().toISOString(),
  });

  console.log("Recorded intervention outcome.");
}
