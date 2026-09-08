import { generateOutcomeDataset } from "../intelligence/outcome-dataset";

import { LightweightOutcomePredictor } from "../intelligence/outcome-predictor";

import {
    printPersonalizationDecisionAnalysis,
    runPersonalizationDecisionAnalysis,
} from "./personalization-decision-analysis";

const predictor = new LightweightOutcomePredictor();

const dataset = generateOutcomeDataset(2000);

predictor.train(dataset);

console.log("Predictor trained with", dataset.length, "synthetic examples.");

const analysis = runPersonalizationDecisionAnalysis(predictor);

printPersonalizationDecisionAnalysis(analysis);
