import { executeIntervention } from "./intervention-executor";

async function runTest(): Promise<void> {
  console.log("\n========================================");

  console.log("REAL INTERVENTION CAPABILITY TEST");

  console.log("========================================");

  const actions = [
    "reduce_brightness",
    "reduce_haptics",
    "reduce_audio",
    "limit_background_activity",
    "no_action",
  ] as const;

  for (const action of actions) {
    const result = await executeIntervention(action);

    console.log(`\n${action}`);

    console.log(result);
  }

  console.log("\nIntervention capability test complete.");
}

void runTest();
