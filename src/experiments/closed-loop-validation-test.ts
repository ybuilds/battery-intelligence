import type { AppCategory } from "../types/behaviour";
import type { ExperimentalTrial } from "../types/trial";

import { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";

import { generateOutcomeDataset } from "../intelligence/outcome-dataset";

import { getBehaviourProfile } from "../storage/behaviour-profile-repository";

import { loadPreferences } from "../storage/preference-repository";

import { TrialDeviceController } from "./trial-device-controller";

const TEST_APP_NAME = "ClosedLoopValidationApp";

const CATEGORY: AppCategory = "social";

function createPredictor(): LightweightOutcomePredictor {
  const predictor = new LightweightOutcomePredictor();

  const dataset = generateOutcomeDataset(2000);

  predictor.train(dataset);

  console.log(
    "Outcome predictor trained on",
    dataset.length,
    "synthetic examples.",
  );

  return predictor;
}

async function printPersistentState(label: string): Promise<void> {
  const profile = await getBehaviourProfile(TEST_APP_NAME);

  const preferences = await loadPreferences();

  console.log(`\n=== ${label} ===`);

  console.log({
    profileExists: profile !== null,

    observationCount: profile?.observationCount ?? 0,

    profileConfidence: Number((profile?.profileConfidence ?? 0).toFixed(4)),

    averageSessionDuration: Number(
      (profile?.averageSessionDurationMinutes ?? 0).toFixed(2),
    ),

    averageScreenDependency: Number(
      (profile?.averageScreenDependency ?? 0).toFixed(3),
    ),

    averageAudioDependency: Number(
      (profile?.averageAudioDependency ?? 0).toFixed(3),
    ),

    averageNetworkDependency: Number(
      (profile?.averageNetworkDependency ?? 0).toFixed(3),
    ),

    averagePreferredBrightness: Number(
      (profile?.averagePreferredBrightness ?? 0).toFixed(3),
    ),

    brightnessAccepted: preferences.reduce_brightness.accepted,

    brightnessRejected: preferences.reduce_brightness.rejected,

    hapticsAccepted: preferences.reduce_haptics.accepted,

    audioAccepted: preferences.reduce_audio.accepted,

    backgroundAccepted: preferences.limit_background_activity.accepted,
  });
}

function createTrial(trialId: string, repetition: number): ExperimentalTrial {
  return {
    trialId,

    system: "personalized",

    condition: "intervention",

    appName: TEST_APP_NAME,

    startingBatteryLevel: 50,

    targetDurationMinutes: 5,

    status: "planned",

    allocation: {
      block: 1,

      repetition,

      randomizedOrder: repetition,
    },
  };
}

async function runTrial(
  predictor: LightweightOutcomePredictor,
  trialId: string,
  repetition: number,
): Promise<void> {
  const trial = createTrial(trialId, repetition);

  const controller = new TrialDeviceController(trial, CATEGORY);

  console.log("\n----------------------------------------");

  console.log(`Starting real-device trial ${repetition}`);

  console.log("----------------------------------------");

  const session = await controller.start(predictor);

  console.log("Session started:");

  console.log({
    sessionId: session.sessionId,

    trialId: session.trialId,

    system: session.system,

    condition: session.condition,

    batteryBefore: session.batteryBefore.level,

    selectedAction: session.selectedAction,

    decision: session.decision,
  });

  console.log("\nPolicy decision:");

  console.log(controller.getDecision());

  /*
   * These calls simulate observed interaction
   * events for validation of the observation pipeline.
   *
   * In the actual experiment UI these events should
   * come from real user interaction.
   */
  controller.recordInteraction();

  controller.recordInteraction();

  controller.recordNetworkUsage();

  /*
   * Record explicit user acceptance for this
   * validation trial.
   *
   * This feeds the preference model when the
   * selected action is an intervention.
   */
  await controller.recordDecision("accepted");

  const measurement = await controller.complete();

  console.log("\nMeasurement persisted:");

  console.log({
    sessionId: measurement.sessionId,

    batteryBefore: measurement.batteryBefore,

    batteryAfter: measurement.batteryAfter,

    batteryDelta: measurement.batteryDelta,

    durationMinutes: Number(measurement.measuredDurationMinutes.toFixed(3)),

    userAcceptance: measurement.userAcceptance,
  });

  console.log("\nBehaviour persisted:");

  console.log(measurement.behaviour);
}

async function main(): Promise<void> {
  console.log("\n========================================");

  console.log("CLOSED-LOOP PERSONALIZATION VALIDATION");

  console.log("========================================");

  /*
   * IMPORTANT:
   *
   * This validation uses a dedicated test app
   * identifier so that it does not mix its
   * observations with another application's
   * research data.
   */

  const predictor = createPredictor();

  /*
   * ----------------------------------------
   * STATE BEFORE LEARNING
   * ----------------------------------------
   */

  await printPersistentState("STATE BEFORE REAL-DEVICE TRIAL");

  /*
   * ----------------------------------------
   * REAL-DEVICE TRIAL
   * ----------------------------------------
   *
   * The application should remain open while
   * the trial is running.
   *
   * The controller reads actual battery state,
   * records observed interaction, records the
   * user decision, and persists the completed
   * behavioural observation.
   */

  await runTrial(predictor, "closed-loop-trial-001", 1);

  /*
   * ----------------------------------------
   * STATE AFTER FIRST TRIAL
   * ----------------------------------------
   */

  await printPersistentState("STATE AFTER FIRST REAL-DEVICE TRIAL");

  /*
   * ----------------------------------------
   * SECOND TRIAL
   * ----------------------------------------
   *
   * The important part is that this trial starts
   * after the first trial's profile and preference
   * data have been persisted.
   */

  await runTrial(predictor, "closed-loop-trial-002", 2);

  /*
   * ----------------------------------------
   * FINAL STATE
   * ----------------------------------------
   */

  await printPersistentState("STATE AFTER SECOND REAL-DEVICE TRIAL");

  const finalProfile = await getBehaviourProfile(TEST_APP_NAME);

  const finalPreferences = await loadPreferences();

  console.log("\n========================================");

  console.log("CLOSED-LOOP VALIDATION RESULT");

  console.log("========================================");

  console.log({
    observationsPersisted: finalProfile?.observationCount ?? 0,

    personalizationConfidence: Number(
      (finalProfile?.profileConfidence ?? 0).toFixed(4),
    ),

    acceptedBrightnessDecisions: finalPreferences.reduce_brightness.accepted,

    acceptedHapticDecisions: finalPreferences.reduce_haptics.accepted,

    acceptedAudioDecisions: finalPreferences.reduce_audio.accepted,

    acceptedBackgroundDecisions:
      finalPreferences.limit_background_activity.accepted,
  });

  console.log("\nValidated closed-loop architecture:");

  console.log("Real device observation");

  console.log("        ↓");

  console.log("Behaviour observation");

  console.log("        ↓");

  console.log("SQLite behaviour_observations");

  console.log("        ↓");

  console.log("BehaviourProfile");

  console.log("        ↓");

  console.log("Personalized B4 decision");

  console.log("        ↓");

  console.log("User acceptance / rejection");

  console.log("        ↓");

  console.log("SQLite user_preferences");

  console.log("\nClosed-loop validation complete.");
}

void main();
