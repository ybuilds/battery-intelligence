import type { AppBehaviour, AppCategory } from "../types/behaviour";

import type { BatteryState } from "../types/battery";

import { SessionObserver } from "../device/session-observer";

import { getCurrentBatteryState } from "../device/battery-monitor";

import { buildBehaviourObservation } from "./observation-builder";

import { recordBehaviourObservation } from "../storage/behaviour-repository";

export type CollectedObservation = {
  battery: BatteryState;
  behaviour: AppBehaviour;
};

export async function collectCurrentObservation(
  appName: string,
  category: AppCategory,
  observer: SessionObserver,
): Promise<CollectedObservation> {
  const battery = await getCurrentBatteryState();

  const interaction = observer.getState();

  const behaviour = buildBehaviourObservation(
    battery,
    interaction,
    appName,
    category,
  );

  await recordBehaviourObservation(behaviour);

  return {
    battery,
    behaviour,
  };
}
