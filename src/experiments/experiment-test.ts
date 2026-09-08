import { ExperimentSessionManager } from "./experiment-session-manager";

export async function testExperimentSession(): Promise<void> {
  const manager = new ExperimentSessionManager(
    "Battery Intelligence Test",
    "utilities",
  );

  console.log("Initial experiment state:", manager.getState());

  const session = await manager.start("reduce_brightness");

  console.log("Experiment started:", session);

  manager.recordInteraction();
  manager.recordInteraction();
  manager.recordNetworkUsage();

  await manager.recordDecision("accepted");

  console.log("Experiment state after decision:", manager.getState());

  const result = await manager.complete();

  console.log("Experiment completed:", result);

  console.log("Final experiment state:", manager.getState());
}
