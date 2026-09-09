import type { InterventionAction } from "./intervention";
import type { InterventionExecutionMode } from "./intervention-capability";

export type InterventionExecution = {
  action: InterventionAction;

  executionMode: InterventionExecutionMode;

  attempted: boolean;

  executed: boolean;

  beforeValue?: number;

  afterValue?: number;

  executionParameter?: number;

  errorMessage?: string;

  executedAt: string;

  restored: boolean;

  restoredAt?: string;
};
