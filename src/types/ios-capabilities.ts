export type CapabilityAvailability =
  | "available"
  | "limited"
  | "restricted"
  | "unavailable";

export type IOSCapability = {
  name: string;
  availability: CapabilityAvailability;
  description: string;
  researchUse: string;
};

export const IOS_CAPABILITIES: IOSCapability[] = [
  {
    name: "battery_level",
    availability: "available",
    description: "Current device battery level.",
    researchUse: "Battery state and intervention pressure.",
  },

  {
    name: "charging_state",
    availability: "available",
    description: "Whether the device is currently charging.",
    researchUse:
      "Distinguishing active battery depletion from charging periods.",
  },

  {
    name: "low_power_mode",
    availability: "available",
    description: "Whether iOS Low Power Mode is active.",
    researchUse: "Contextual battery-management state.",
  },

  {
    name: "device_information",
    availability: "available",
    description: "Device and operating-system characteristics.",
    researchUse: "Device-specific modelling and experiment stratification.",
  },

  {
    name: "screen_brightness",
    availability: "available",
    description:
      "Current screen brightness can be observed in supported app contexts.",
    researchUse:
      "Screen dependency and brightness-related intervention modelling.",
  },

  {
    name: "current_app_context",
    availability: "limited",
    description:
      "The application can observe its own active execution context, but iOS does not provide unrestricted visibility into arbitrary foreground applications.",
    researchUse: "Contextual modelling within the application.",
  },

  {
    name: "cross_app_usage_history",
    availability: "restricted",
    description:
      "Detailed usage history for arbitrary applications is subject to iOS privacy and entitlement restrictions.",
    researchUse:
      "Requires an approved iOS framework/entitlement and should not be assumed available.",
  },

  {
    name: "per_app_cpu_energy",
    availability: "restricted",
    description:
      "Third-party applications cannot generally obtain unrestricted system-level per-application energy telemetry.",
    researchUse: "Requires alternative measurement methodology.",
  },

  {
    name: "background_process_control",
    availability: "restricted",
    description:
      "Third-party applications cannot arbitrarily terminate or throttle other applications' background activity.",
    researchUse:
      "Should be treated as recommendation rather than direct system intervention.",
  },

  {
    name: "system_haptic_control",
    availability: "restricted",
    description:
      "An application cannot generally impose arbitrary system-wide haptic settings on behalf of the user.",
    researchUse: "Can instead model or recommend haptic-related behaviour.",
  },

  {
    name: "audio_control",
    availability: "limited",
    description:
      "Audio behaviour is subject to application context and iOS audio-session rules.",
    researchUse:
      "Can be investigated experimentally within supported application contexts.",
  },
];
