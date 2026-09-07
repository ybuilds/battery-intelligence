import type { UserEnergyPreferences } from "../types/preferences";

export const defaultPreferences: UserEnergyPreferences = {
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
