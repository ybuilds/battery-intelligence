import { defaultPreferences } from "../data/default-preferences";

import {
    getPersonalizationStrength,
    getPersonalizedPreferenceScore,
} from "./personalization-engine";

export function testPersonalizationEngine() {
  const initialScore = getPersonalizedPreferenceScore(
    defaultPreferences,
    "reduce_brightness",
  );

  const initialStrength = getPersonalizationStrength(
    defaultPreferences,
    "reduce_brightness",
  );

  console.log("Initial brightness preference:", initialScore);

  console.log("Initial personalization strength:", initialStrength);

  const experiencedPreferences = {
    ...defaultPreferences,

    reduce_brightness: {
      accepted: 40,
      rejected: 5,
    },
  };

  const experiencedScore = getPersonalizedPreferenceScore(
    experiencedPreferences,
    "reduce_brightness",
  );

  const experiencedStrength = getPersonalizationStrength(
    experiencedPreferences,
    "reduce_brightness",
  );

  console.log("Experienced brightness preference:", experiencedScore);

  console.log("Experienced personalization strength:", experiencedStrength);
}
