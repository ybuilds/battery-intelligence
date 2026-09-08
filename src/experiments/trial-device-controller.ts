import { getCurrentBatteryState } from "../device/battery-monitor";
import { SessionObserver } from "../device/session-observer";
import { ExperimentController } from "./experiment-controller";

import type {
  ExperimentControllerState,
  InterventionMeasurementResult,
} from "./experiment-controller";

import type { BaselineDecision } from "../baselines/baseline-types";
import type { EvaluationScenario } from "../evaluation/evaluation-types";
import type { AppCategory } from "../types/behaviour";
import type { BehaviourProfile } from "../types/behaviour-profile";
import type { UserEnergyPreferences } from "../types/preferences";
import type { ExperimentalTrial } from "../types/trial";

import type { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";

import { getBehaviourProfile } from "../storage/behaviour-profile-repository";
import { loadPreferences } from "../storage/preference-repository";
import { createTrialDecision } from "./trial-policy-decision";

export class TrialDeviceController {
  private readonly trial: ExperimentalTrial;
  private readonly category: AppCategory;
  private readonly observer: SessionObserver;
  private readonly controller: ExperimentController;

  private latestDecision: BaselineDecision | null = null;
  private latestProfile: BehaviourProfile | null = null;
  private latestPreferences: UserEnergyPreferences | null = null;

  constructor(trial: ExperimentalTrial, category: AppCategory) {
    this.trial = trial;
    this.category = category;

    this.observer = new SessionObserver();

    this.controller = new ExperimentController({
      trialId: trial.trialId,
      system: trial.system,
      appName: trial.appName,
      category: this.category,
      observer: this.observer,
    });
  }

  public async start(
    predictor: LightweightOutcomePredictor,
  ): Promise<ExperimentControllerState> {
    /*
     * Step 1:
     * Read the actual battery level immediately before
     * making the experimental policy decision.
     */
    const battery = await getCurrentBatteryState();

    /*
     * Step 2:
     * Load the user's learned behaviour profile.
     *
     * This is the historical personalization signal
     * used by B4.
     */
    const profile = await getBehaviourProfile(this.trial.appName);

    /*
     * Step 3:
     * Load intervention preferences learned from
     * previous user decisions.
     */
    const preferences = await loadPreferences();

    this.latestProfile = profile;
    this.latestPreferences = preferences;

    /*
     * Step 4:
     * Construct the current observation.
     *
     * Current-session behaviour is intentionally kept
     * separate from historical profile information.
     */
    const behaviour = {
      appName: this.trial.appName,
      category: this.category,

      sessionDurationMinutes: 0,

      interactionIntensity: "medium" as const,

      screenDependency: 0.8,

      audioDependency:
        this.category === "music" || this.category === "video" ? 0.8 : 0.2,

      networkDependency: 0.7,

      typicalSessionDurationMinutes: this.trial.targetDurationMinutes,

      preferredBrightness: 0.7,

      usageContext: getCurrentUsageContext(),
    };

    /*
     * Step 5:
     * Build the exact scenario presented to the
     * experimental policy.
     */
    const scenario: EvaluationScenario = {
      scenarioId: `device-${this.trial.trialId}`,

      description: `Real-device experiment for ${this.trial.appName}.`,

      battery,

      behaviour,

      preferences,

      profile,
    };

    /*
     * Step 6:
     * Run the selected baseline policy.
     *
     * B1:
     *   battery only
     *
     * B2:
     *   battery + current behaviour
     *
     * B3:
     *   battery + behaviour + prediction
     *
     * B4:
     *   battery + behaviour + history
     *   + preferences + prediction
     */
    const decision = createTrialDecision(this.trial, scenario, predictor);

    this.latestDecision = decision;

    /*
     * Control trials always receive no_action,
     * regardless of what the policy recommends.
     */
    const selectedAction =
      this.trial.condition === "control"
        ? "no_action"
        : decision.selectedAction;

    /*
     * Step 7:
     * Persist the experimental session through the
     * existing ExperimentController.
     */
    return this.controller.start(selectedAction, this.trial.condition);
  }

  public async recordDecision(
    decision: "accepted" | "rejected" | "ignored",
  ): Promise<void> {
    await this.controller.recordDecision(decision);
  }

  public recordInteraction(): void {
    this.controller.recordInteraction();
  }

  public recordAudioUsage(): void {
    this.controller.recordAudioUsage();
  }

  public recordNetworkUsage(): void {
    this.controller.recordNetworkUsage();
  }

  public recordHapticUsage(): void {
    this.controller.recordHapticUsage();
  }

  public async complete(): Promise<InterventionMeasurementResult> {
    return this.controller.complete();
  }

  public getSession(): ExperimentControllerState | null {
    return this.controller.getSession();
  }

  public getTrial(): ExperimentalTrial {
    return this.trial;
  }

  public getDecision(): BaselineDecision | null {
    return this.latestDecision;
  }

  public getProfile(): BehaviourProfile | null {
    return this.latestProfile;
  }

  public getPreferences(): UserEnergyPreferences | null {
    return this.latestPreferences;
  }
}

function getCurrentUsageContext():
  | "morning"
  | "afternoon"
  | "evening"
  | "night" {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 22) {
    return "evening";
  }

  return "night";
}
