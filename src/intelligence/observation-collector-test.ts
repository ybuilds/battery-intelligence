import { SessionObserver } from "../device/session-observer";

import { collectCurrentObservation } from "./observation-collector";

export async function testObservationCollector() {
  const observer = new SessionObserver();

  observer.recordInteraction();

  observer.recordInteraction();

  observer.recordInteraction();

  observer.recordNetworkUsage();

  const observation = await collectCurrentObservation(
    "Battery Intelligence",
    "utilities",
    observer,
  );

  console.log("Collected real-device observation:");

  console.log({
    battery: observation.battery,

    behaviour: observation.behaviour,
  });
}
