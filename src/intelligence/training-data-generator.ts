import { generateBehaviourDataset } from "../data/behaviour-generator";
import { defaultPreferences } from "../data/default-preferences";
import { sampleBattery } from "../data/sample-battery";
import type { BatteryState } from "../types/battery";
import type { UserEnergyPreferences } from "../types/preferences";
import { buildInterventionFeatures } from "./feature-engine";
import { selectIntervention } from "./intervention-engine";
import type { TrainingExample } from "./training-types";

function generateBatteryState(): BatteryState {
  const batteryLevels = [10, 15, 20, 25, 30, 35, 40, 50, 60, 75];

  const level = batteryLevels[Math.floor(Math.random() * batteryLevels.length)];

  return {
    ...sampleBattery,
    level,
    isCharging: false,
    lowPowerMode: level <= 20,
    estimatedMinutesRemaining: Math.max(20, level * 3),
  };
}

function generatePreferences(): UserEnergyPreferences {
  const preferences: UserEnergyPreferences = {
    ...defaultPreferences,
    reduce_brightness: {
      accepted: 0,
      rejected: 0,
    },
    reduce_haptics: {
      accepted: 0,
      rejected: 0,
    },
    reduce_audio: {
      accepted: 0,
      rejected: 0,
    },
    limit_background_activity: {
      accepted: 0,
      rejected: 0,
    },
  };

  const actions = [
    "reduce_brightness",
    "reduce_haptics",
    "reduce_audio",
    "limit_background_activity",
  ] as const;

  for (const action of actions) {
    const accepted = Math.floor(Math.random() * 10);

    const rejected = Math.floor(Math.random() * 10);

    preferences[action] = {
      accepted,
      rejected,
    };
  }

  return preferences;
}

export function generateTrainingDataset(count: number): TrainingExample[] {
  const behaviours = generateBehaviourDataset(count);

  return behaviours.map((behaviour) => {
    const battery = generateBatteryState();

    const preferences = generatePreferences();

    const features = buildInterventionFeatures(battery, behaviour, preferences);

    const intervention = selectIntervention(battery, behaviour, preferences);

    return {
      features,
      targetAction: intervention.action,
    };
  });
}
