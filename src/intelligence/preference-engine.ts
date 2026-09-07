import type { InterventionAction, UserDecision } from "../types/intervention";
import type { UserEnergyPreferences } from "../types/preferences";

export function recordUserDecision(
  preferences: UserEnergyPreferences,
  action: InterventionAction,
  decision: UserDecision,
): UserEnergyPreferences {
  if (action === "no_action") {
    return preferences;
  }

  const updated = {
    ...preferences,

    [action]: {
      ...preferences[action],
    },
  };

  if (decision === "accepted") {
    updated[action].accepted += 1;
  }

  if (decision === "rejected") {
    updated[action].rejected += 1;
  }

  return updated;
}

export function getPreferenceScore(
  preferences: UserEnergyPreferences,
  action: InterventionAction,
): number {
  if (action === "no_action") {
    return 0;
  }

  const preference = preferences[action];

  const total = preference.accepted + preference.rejected;

  if (total === 0) {
    return 0.5;
  }

  return preference.accepted / total;
}
