import { generateTrainingDataset } from "./training-data-generator";

export function testTrainingDataset() {
  const dataset = generateTrainingDataset(100);

  console.log("Training dataset size:", dataset.length);

  console.log("First training example:", dataset[0]);

  console.log("First target action:", dataset[0]?.targetAction);

  const distribution: Record<string, number> = {};

  for (const example of dataset) {
    distribution[example.targetAction] =
      (distribution[example.targetAction] ?? 0) + 1;
  }

  console.log("Target action distribution:", distribution);
}
