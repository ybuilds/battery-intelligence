import { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";

import { generateOutcomeDataset } from "../intelligence/outcome-dataset";

import {
    createDefaultLongitudinalConfig,
    createLongitudinalExperimentPlan,
} from "./longitudinal-experiment";

import { LongitudinalExperimentController } from "./longitudinal-controller";

async function runTest(): Promise<void> {
  console.log("\n========================================");

  console.log("LONGITUDINAL PERSISTENCE TEST");

  console.log("========================================");

  const config = createDefaultLongitudinalConfig();

  /*
   * Keep the test small.
   */
  config.blocks = 1;

  config.repetitionsPerBlock = 1;

  const plan = createLongitudinalExperimentPlan(config);

  const predictor = new LightweightOutcomePredictor();

  const dataset = generateOutcomeDataset(2000);

  predictor.train(dataset);

  /*
   * Create persistent campaign.
   */
  const controller = await LongitudinalExperimentController.create(
    plan,
    predictor,
  );

  console.log("\nCampaign created:", controller.getSnapshot());

  const firstTrial = controller.prepareNextTrial();

  console.log("\nFirst trial:", firstTrial?.trialId);

  console.log("First trial system:", firstTrial?.system);

  console.log("Progress:", controller.getProgress());

  /*
   * Simulate application restart by
   * constructing a completely new controller.
   */
  const resumedController = await LongitudinalExperimentController.resume(
    plan,
    predictor,
  );

  console.log("\nResumed controller:", resumedController.getSnapshot());

  const resumedTrial = resumedController.prepareNextTrial();

  console.log("\nResumed next trial:", resumedTrial?.trialId);

  console.log("Resumed system:", resumedTrial?.system);

  if (resumedTrial?.trialId !== firstTrial?.trialId) {
    throw new Error(
      "Persistence test failed: resumed trial does not match the expected next trial.",
    );
  }

  console.log("\nPersistence test passed.");

  console.log("Campaign state survives controller recreation.");
}

void runTest();
