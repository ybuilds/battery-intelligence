import { ControlledExperiment } from "./controlled-experiment";

export async function testControlledExperiment(): Promise<void> {
  const experiment = new ControlledExperiment(
    "test-trial-intervention",
    "personalized",
    "Battery Intelligence Test",
    "utilities",
  );

  console.log("Starting controlled experiment...");

  await experiment.start();

  console.log("Recommendation generated and experiment started.");

  experiment.recordInteraction();
  experiment.recordInteraction();
  experiment.recordNetworkUsage();

  await experiment.accept();

  console.log("User decision recorded: accepted");

  const result = await experiment.complete();

  console.log("=== EXPERIMENT RESULT ===");

  console.log({
    sessionId: result.sessionId,
    selectedAction: result.selectedAction,
    batteryBefore: result.measurement.batteryBefore,
    batteryAfter: result.measurement.batteryAfter,
    batteryDelta: result.measurement.batteryDelta,
    durationMinutes: result.measurement.measuredDurationMinutes,
    userAcceptance: result.measurement.userAcceptance,
  });

  const controlExperiment = new ControlledExperiment(
    "test-trial-control",
    "personalized",
    "Battery Intelligence Control Test",
    "utilities",
  );

  await controlExperiment.startControl();

  controlExperiment.recordInteraction();
  controlExperiment.recordNetworkUsage();

  await controlExperiment.ignore();

  const controlResult = await controlExperiment.complete();

  console.log("=== CONTROL RESULT ===");

  console.log({
    condition: controlResult.condition,
    selectedAction: controlResult.selectedAction,
    batteryBefore: controlResult.measurement.batteryBefore,
    batteryAfter: controlResult.measurement.batteryAfter,
    batteryDelta: controlResult.measurement.batteryDelta,
  });
}
