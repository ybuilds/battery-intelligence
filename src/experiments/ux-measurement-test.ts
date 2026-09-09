import { createUXMeasurement, summarizeUXMeasurement } from "./ux-measurement";

function runTest(): void {
  console.log("\n========================================");

  console.log("UX MEASUREMENT TEST");

  console.log("========================================");

  const measurement = createUXMeasurement({
    visualImpact: 2,
    audioImpact: 1,
    interactionImpact: 3,
    responsivenessImpact: 2,
    overallImpact: 2,
  });

  console.log("\nMeasurement:", measurement);

  const summary = summarizeUXMeasurement(measurement);

  console.log("\nUX summary:", summary);

  if (summary.compositeImpact <= 0 || summary.compositeImpact > 5) {
    throw new Error("UX composite is outside the valid 1–5 range.");
  }

  if (summary.overallImpact !== 2) {
    throw new Error("UX overall impact was not preserved.");
  }

  console.log("\nUX measurement test passed.");
}

runTest();
