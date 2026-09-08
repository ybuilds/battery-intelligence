import { getDatabase } from "../storage/database";

import {
    loadPreferences,
    recordPreferenceDecision,
} from "../storage/preference-repository";

import { getBehaviourProfile } from "../storage/behaviour-profile-repository";

import { recordBehaviourObservation } from "../storage/behaviour-repository";

import type { AppBehaviour } from "../types/behaviour";
import type { InterventionAction } from "../types/intervention";

import { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";

import { generateOutcomeDataset } from "../intelligence/outcome-dataset";

import type { EvaluationScenario } from "../evaluation/evaluation-types";

import { executePolicy } from "./policy-executor";

const TEST_APP_NAME = "SQLitePersonalizationTest";

async function clearTestData(): Promise<void> {
  const db = await getDatabase();

  /*
   * Remove only observations belonging to this
   * validation test.
   */
  await db.runAsync(
    `
    DELETE FROM behaviour_observations
    WHERE app_name = ?
    `,
    TEST_APP_NAME,
  );

  /*
   * Reset preference history so that the test
   * always starts from a cold preference state.
   */
  await db.runAsync(
    `
    UPDATE user_preferences
    SET accepted_count = 0,
        rejected_count = 0,
        updated_at = ?
    `,
    new Date().toISOString(),
  );
}

function createObservation(
  sessionDurationMinutes: number,
  preferredBrightness: number,
): AppBehaviour {
  return {
    appName: TEST_APP_NAME,

    category: "social",

    sessionDurationMinutes,

    interactionIntensity: "high",

    screenDependency: 0.9,

    audioDependency: 0.2,

    networkDependency: 0.8,

    typicalSessionDurationMinutes: 25,

    preferredBrightness,

    usageContext: "evening",
  };
}

async function recordObservation(observation: AppBehaviour): Promise<void> {
  await recordBehaviourObservation(observation);
}

function createPredictor(): LightweightOutcomePredictor {
  const predictor = new LightweightOutcomePredictor();

  /*
   * Synthetic data is used ONLY to initialise
   * the lightweight outcome predictor.
   *
   * It is not the personalization history.
   */
  const dataset = generateOutcomeDataset(2000);

  predictor.train(dataset);

  console.log(
    "Outcome predictor trained on",
    dataset.length,
    "synthetic examples.",
  );

  return predictor;
}

async function createScenario(
  profile: Awaited<ReturnType<typeof getBehaviourProfile>>,
): Promise<EvaluationScenario> {
  const preferences = await loadPreferences();

  return {
    scenarioId: "sqlite-personalization-test",

    description: "Real SQLite personalization validation.",

    battery: {
      level: 25,
      isCharging: false,
      lowPowerMode: false,
      estimatedMinutesRemaining: 75,
    },

    behaviour: {
      appName: TEST_APP_NAME,

      category: "social",

      sessionDurationMinutes: 18,

      interactionIntensity: "high",

      screenDependency: 0.8,

      audioDependency: 0.2,

      networkDependency: 0.85,

      typicalSessionDurationMinutes: 22,

      preferredBrightness: 0.7,

      usageContext: "evening",
    },

    preferences,

    profile,
  };
}

function printProfile(
  label: string,
  profile: Awaited<ReturnType<typeof getBehaviourProfile>>,
): void {
  console.log(`\n=== ${label} ===`);

  if (!profile) {
    console.log("Profile: NONE");

    return;
  }

  console.log({
    appName: profile.appName,

    observationCount: profile.observationCount,

    confidence: Number(profile.profileConfidence.toFixed(4)),

    averageSessionDuration: Number(
      profile.averageSessionDurationMinutes.toFixed(2),
    ),

    averageScreenDependency: Number(profile.averageScreenDependency.toFixed(3)),

    averageAudioDependency: Number(profile.averageAudioDependency.toFixed(3)),

    averageNetworkDependency: Number(
      profile.averageNetworkDependency.toFixed(3),
    ),

    averagePreferredBrightness: Number(
      profile.averagePreferredBrightness.toFixed(3),
    ),

    dominantInteractionIntensity: profile.dominantInteractionIntensity,

    dominantContext: profile.dominantContext,
  });
}

async function printPreferences(label: string): Promise<void> {
  const preferences = await loadPreferences();

  console.log(`\n=== ${label} ===`);

  console.log({
    brightness: preferences.reduce_brightness,

    haptics: preferences.reduce_haptics,

    audio: preferences.reduce_audio,

    background: preferences.limit_background_activity,
  });
}

async function evaluatePolicy(
  label: string,
  predictor: LightweightOutcomePredictor,
): Promise<void> {
  const profile = await getBehaviourProfile(TEST_APP_NAME);

  const scenario = await createScenario(profile);

  const decision = executePolicy("personalized", scenario, predictor);

  console.log(`\n=== ${label} ===`);

  console.log({
    selectedAction: decision.selectedAction,

    score: Number(decision.score.toFixed(4)),

    estimatedEnergySaving: Number(decision.estimatedEnergySaving.toFixed(4)),

    estimatedUXImpact: Number(decision.estimatedUXImpact.toFixed(4)),

    reason: decision.reason,
  });
}

async function main(): Promise<void> {
  console.log("\n========================================");

  console.log("SQLite Personalization Validation");

  console.log("========================================");

  /*
   * Always start from a known database state.
   */
  await clearTestData();

  const predictor = createPredictor();

  /*
   * ==================================================
   * CASE 1 — COLD START
   * ==================================================
   *
   * No historical observations.
   * No historical user decisions.
   */
  console.log("\n\n----------------------------------------");

  console.log("CASE 1 — COLD START");

  console.log("----------------------------------------");

  const coldStartProfile = await getBehaviourProfile(TEST_APP_NAME);

  printProfile("Cold-start behaviour profile", coldStartProfile);

  await printPreferences("Cold-start preferences");

  await evaluatePolicy("Cold-start personalized policy", predictor);

  /*
   * ==================================================
   * CASE 2 — LEARNED BEHAVIOUR
   * ==================================================
   *
   * Add repeated behavioural observations.
   *
   * The profile should now be constructed from
   * SQLite rather than synthetic data.
   */
  console.log("\n\n----------------------------------------");

  console.log("CASE 2 — LEARNED BEHAVIOUR");

  console.log("----------------------------------------");

  console.log("Recording behavioural observations...");

  const observations: AppBehaviour[] = [
    createObservation(28, 0.35),
    createObservation(31, 0.4),
    createObservation(25, 0.3),
    createObservation(29, 0.35),
    createObservation(33, 0.4),
    createObservation(27, 0.35),
    createObservation(30, 0.3),
    createObservation(26, 0.4),
    createObservation(32, 0.35),
    createObservation(29, 0.3),
  ];

  for (const observation of observations) {
    await recordObservation(observation);
  }

  const learnedProfile = await getBehaviourProfile(TEST_APP_NAME);

  printProfile("SQLite-derived behaviour profile", learnedProfile);

  await printPreferences("Preferences before user feedback");

  await evaluatePolicy("Behaviour-personalized policy", predictor);

  /*
   * ==================================================
   * CASE 3 — LEARNED BEHAVIOUR + USER PREFERENCE
   * ==================================================
   *
   * Simulate repeated acceptance of brightness
   * reduction.
   */
  console.log("\n\n----------------------------------------");

  console.log("CASE 3 — BEHAVIOUR + USER PREFERENCE");

  console.log("----------------------------------------");

  const preferenceAction: InterventionAction = "reduce_brightness";

  console.log("Recording accepted brightness interventions...");

  for (let index = 0; index < 10; index += 1) {
    await recordPreferenceDecision(preferenceAction, "accepted");
  }

  await printPreferences("SQLite-derived user preferences");

  await evaluatePolicy("Fully personalized policy", predictor);

  /*
   * ==================================================
   * FINAL VALIDATION
   * ==================================================
   */

  const finalProfile = await getBehaviourProfile(TEST_APP_NAME);

  const finalPreferences = await loadPreferences();

  console.log("\n\n========================================");

  console.log("FINAL VALIDATION");

  console.log("========================================");

  console.log({
    profileExists: finalProfile !== null,

    observationCount: finalProfile?.observationCount ?? 0,

    profileConfidence: Number(
      (finalProfile?.profileConfidence ?? 0).toFixed(4),
    ),

    brightnessAccepted: finalPreferences.reduce_brightness.accepted,

    brightnessRejected: finalPreferences.reduce_brightness.rejected,
  });

  console.log("\nValidated data flow:");

  console.log("1. Behaviour observations → SQLite");

  console.log("2. SQLite observations → BehaviourProfile");

  console.log("3. User decisions → SQLite preferences");

  console.log("4. SQLite preferences → UserEnergyPreferences");

  console.log("5. BehaviourProfile + preferences → B4");

  console.log("6. B4 → personalized intervention policy");

  console.log("\nSQLite personalization validation complete.");
}

void main();
