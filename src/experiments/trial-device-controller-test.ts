import { TrialDeviceController } from "./trial-device-controller";

import type { BaselineDecision } from "../baselines/baseline-types";
import type { ExperimentalTrial } from "../types/trial";

export async function testTrialDeviceController(): Promise<void> {
  const trial: ExperimentalTrial = {
    trialId: "device-test-trial",
    system: "personalized",
    condition: "control",
    appName: "Battery Intelligence Test",
    startingBatteryLevel: 50,
    targetDurationMinutes: 1,
    status: "planned",
    allocation: {
      block: 1,
      repetition: 1,
      randomizedOrder: 1,
    },
  };

  const controller = new TrialDeviceController(trial, "utilities");

  const decision: BaselineDecision = {
    system: "personalized",
    selectedAction: "no_action",
    score: 0,
    estimatedEnergySaving: 0,
    estimatedUXImpact: 0,
    reason: "Control trial: no intervention.",
  };

  const session = await controller.start(decision);

  console.log("Trial started:", session);

  controller.recordInteraction();
  controller.recordNetworkUsage();

  const measurement = await controller.complete();

  console.log("Real-device measurement:", measurement);

  console.log("Trial completed and experimental record persisted.");
}
