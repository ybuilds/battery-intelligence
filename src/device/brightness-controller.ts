import * as Brightness from "expo-brightness";

export type BrightnessSnapshot = {
  brightness: number;
  capturedAt: string;
};

export async function getCurrentBrightness(): Promise<number> {
  const available = await Brightness.isAvailableAsync();

  if (!available) {
    throw new Error("Brightness control is unavailable on this device.");
  }

  return Brightness.getBrightnessAsync();
}

export async function captureBrightnessSnapshot(): Promise<BrightnessSnapshot> {
  const brightness = await getCurrentBrightness();

  return {
    brightness,
    capturedAt: new Date().toISOString(),
  };
}

export async function setBrightness(brightness: number): Promise<void> {
  if (brightness < 0 || brightness > 1) {
    throw new Error("Brightness must be between 0 and 1.");
  }

  const available = await Brightness.isAvailableAsync();

  if (!available) {
    throw new Error("Brightness control is unavailable on this device.");
  }

  await Brightness.setBrightnessAsync(brightness);
}

export async function reduceBrightness(reductionFraction: number): Promise<{
  before: number;
  after: number;
  reductionFraction: number;
}> {
  if (reductionFraction < 0 || reductionFraction > 1) {
    throw new Error("Brightness reduction fraction must be between 0 and 1.");
  }

  const before = await getCurrentBrightness();

  const after = Math.max(0, Math.min(1, before * (1 - reductionFraction)));

  await setBrightness(after);

  return {
    before,
    after,
    reductionFraction,
  };
}

export async function restoreBrightness(brightness: number): Promise<void> {
  await setBrightness(brightness);
}
