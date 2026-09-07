export type InterventionPreference = {
  accepted: number;
  rejected: number;
};

export type UserEnergyPreferences = {
  reduce_brightness: InterventionPreference;
  reduce_haptics: InterventionPreference;
  reduce_audio: InterventionPreference;
  limit_background_activity: InterventionPreference;
};
