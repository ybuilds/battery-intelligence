import type { InterventionAction } from "../types/intervention";
import type { UserEnergyPreferences } from "../types/preferences";

import {
    loadPreferences,
    recordPreferenceDecision,
} from "../storage/preference-repository";

export type PersonalizationUpdate = {
  action: InterventionAction;
  decision: "accepted" | "rejected";
  previousAcceptanceRate: number;
  updatedAcceptanceRate: number;
};

function calculateAcceptanceRate(accepted: number, rejected: number): number {
  const total = accepted + rejected;

  if (total === 0) {
    return 0.5;
  }

  return accepted / total;
}

export function calculateActionAcceptanceRate(
  preferences: UserEnergyPreferences,
  action: InterventionAction,
): number {
  if (action === "no_action") {
    return 1;
  }

  const preference = preferences[action];

  return calculateAcceptanceRate(preference.accepted, preference.rejected);
}

export async function updatePersonalization(
  action: InterventionAction,
  decision: "accepted" | "rejected",
): Promise<PersonalizationUpdate | null> {
  if (action === "no_action") {
    return null;
  }

  const preferences = await loadPreferences();

  const previousPreference = preferences[action];

  const previousAcceptanceRate = calculateAcceptanceRate(
    previousPreference.accepted,
    previousPreference.rejected,
  );

  await recordPreferenceDecision(action, decision);

  const updatedAccepted =
    previousPreference.accepted + (decision === "accepted" ? 1 : 0);

  const updatedRejected =
    previousPreference.rejected + (decision === "rejected" ? 1 : 0);

  const updatedAcceptanceRate = calculateAcceptanceRate(
    updatedAccepted,
    updatedRejected,
  );

  return {
    action,
    decision,
    previousAcceptanceRate,
    updatedAcceptanceRate,
  };
}

export function getPersonalizationStrength(
  preferences: UserEnergyPreferences,
  action: InterventionAction,
): number {
  if (action === "no_action") {
    return 0;
  }

  const preference = preferences[action];

  const total = preference.accepted + preference.rejected;

  /*
   * More observations mean greater confidence
   * in the user's learned preference.
   *
   * The value asymptotically approaches 1.
   */
  return total / (total + 10);
}

export function getPersonalizedPreferenceScore(
  preferences: UserEnergyPreferences,
  action: InterventionAction,
): number {
  if (action === "no_action") {
    return 1;
  }

  const preference = preferences[action];

  const total = preference.accepted + preference.rejected;

  if (total === 0) {
    return 0.5;
  }

  const observedRate = preference.accepted / total;

  const strength = getPersonalizationStrength(preferences, action);

  /*
   * Start from a neutral prior of 0.5
   * and gradually move toward the
   * user's observed preference.
   */
  return 0.5 * (1 - strength) + observedRate * strength;
}
