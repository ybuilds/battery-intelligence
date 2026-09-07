import { generateOutcomeDataset } from "./outcome-dataset";

export function testOutcomeDataset() {
  const dataset = generateOutcomeDataset(1000);

  console.log("Outcome dataset size:", dataset.length);

  const example = dataset[0];

  if (!example) {
    return;
  }

  console.log("Example action:", example.scenario.action);

  console.log("Battery level:", example.scenario.battery.level);

  console.log("App:", example.scenario.behaviour.appName);

  console.log("Energy saving:", example.expectedOutcome.energySaving);

  console.log("UX impact:", example.expectedOutcome.uxImpact);

  console.log("User acceptance:", example.expectedOutcome.userAcceptance);
}
