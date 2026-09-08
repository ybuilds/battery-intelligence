import {
  DEFAULT_EXPERIMENT_DESIGN,
  generateTrialMatrix,
} from "./experiment-design";

export function testExperimentDesign(): void {
  const trials = generateTrialMatrix(DEFAULT_EXPERIMENT_DESIGN);

  console.log("=== EXPERIMENT DESIGN ===");

  console.log({
    totalTrials: trials.length,
    systems: DEFAULT_EXPERIMENT_DESIGN.systems,
    repetitionsPerSystem: DEFAULT_EXPERIMENT_DESIGN.repetitionsPerSystem,
    targetDurationMinutes: DEFAULT_EXPERIMENT_DESIGN.targetDurationMinutes,
  });

  for (const system of DEFAULT_EXPERIMENT_DESIGN.systems) {
    const systemTrials = trials.filter((trial) => trial.system === system);

    console.log({
      system,
      trialCount: systemTrials.length,

      controlTrials: systemTrials.filter(
        (trial) => trial.condition === "control",
      ).length,

      interventionTrials: systemTrials.filter(
        (trial) => trial.condition === "intervention",
      ).length,
    });
  }

  console.log({
    totalTrials: trials.length,
  });
}
