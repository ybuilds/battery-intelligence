import type { AppCategory } from "../types/behaviour";
import type { ExperimentalTrial } from "../types/trial";

import { generateOutcomeDataset } from "../intelligence/outcome-dataset";
import { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";

import { TrialDeviceController } from "./trial-device-controller";

const trial: ExperimentalTrial = {
  trialId: "device-controller-test-001",
  system: "personalized",
  condition: "intervention",
  appName: "Instagram",
  startingBatteryLevel: 50,
  targetDurationMinutes: 5,
  status: "planned",
  allocation: {
    block: 1,
    repetition: 1,
    randomizedOrder: 1,
  },
};

const category: AppCategory = "social";

async function runTest() {
  console.log("Starting TrialDeviceController test...");

  const predictor = new LightweightOutcomePredictor();

  const dataset = generateOutcomeDataset(2000);

  predictor.train(dataset);

  console.log("Predictor trained:", dataset.length, "examples");

  const controller = new TrialDeviceController(trial, category);

  const session = await controller.start(predictor);

  console.log("Real-device experiment session:", session);

  console.log("Selected policy decision:", controller.getDecision());

  controller.recordInteraction();
  controller.recordNetworkUsage();

  await controller.recordDecision("accepted");

  const measurement = await controller.complete();

  console.log("Real-device measurement:", measurement);

  console.log("Trial completed and experimental record persisted.");
}

void runTest();
