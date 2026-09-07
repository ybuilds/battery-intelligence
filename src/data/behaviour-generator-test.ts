import {
    generateBehaviourDataset,
    generateBehaviourObservation,
} from "./behaviour-generator";

export function testBehaviourGenerator() {
  const singleObservation = generateBehaviourObservation();

  console.log("Generated behaviour observation:", singleObservation);

  const dataset = generateBehaviourDataset(100);

  console.log("Generated behaviour dataset size:", dataset.length);

  console.log("First three observations:", dataset.slice(0, 3));
}
