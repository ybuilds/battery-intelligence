import type { SessionInteractionState } from "../types/observation";

export class SessionObserver {
  private sessionStartedAt: number;

  private interactionCount = 0;

  private audioUsed = false;

  private networkUsed = false;

  private hapticsUsed = false;

  constructor() {
    this.sessionStartedAt = Date.now();
  }

  public recordInteraction(): void {
    this.interactionCount += 1;
  }

  public recordAudioUsage(): void {
    this.audioUsed = true;
  }

  public recordNetworkUsage(): void {
    this.networkUsed = true;
  }

  public recordHapticUsage(): void {
    this.hapticsUsed = true;
  }

  public getState(): SessionInteractionState {
    const activeDurationSeconds = Math.max(
      0,
      (Date.now() - this.sessionStartedAt) / 1000,
    );

    return {
      sessionStartedAt: new Date(this.sessionStartedAt).toISOString(),

      interactionCount: this.interactionCount,

      activeDurationSeconds,

      audioUsed: this.audioUsed,

      networkUsed: this.networkUsed,

      hapticsUsed: this.hapticsUsed,
    };
  }

  public reset(): void {
    this.sessionStartedAt = Date.now();

    this.interactionCount = 0;

    this.audioUsed = false;

    this.networkUsed = false;

    this.hapticsUsed = false;
  }
}
