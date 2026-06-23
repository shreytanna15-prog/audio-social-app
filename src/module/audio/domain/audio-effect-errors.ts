import { getAppliedEffectsLabel } from '@/module/audio/domain/audio-effect.helpers';
import type { AudioEffectId } from '@/module/audio/types/effects';

export type EffectErrorPresentation = {
  title: string;
  message: string;
};

type AudioEffectsErrorInput = EffectErrorPresentation & {
  debugDetails?: string;
};

export class AudioEffectsError extends Error {
  readonly title: string;
  readonly userMessage: string;
  readonly debugDetails?: string;

  constructor({ title, message, debugDetails }: AudioEffectsErrorInput) {
    super(message);
    this.name = 'AudioEffectsError';
    this.title = title;
    this.userMessage = message;
    this.debugDetails = debugDetails;
  }
}

export class FfmpegProcessingError extends Error {
  readonly rawOutput: string;

  constructor(rawOutput: string) {
    super('FFmpeg processing failed');
    this.name = 'FfmpegProcessingError';
    this.rawOutput = rawOutput;
  }
}

function isFfmpegNoiseLine(line: string): boolean {
  return (
    /^ffmpeg version/i.test(line) ||
    /^copyright/i.test(line) ||
    /^built with/i.test(line) ||
    /^configuration:/i.test(line) ||
    /^libav/i.test(line) ||
    /^Input #\d/i.test(line) ||
    /^Output #\d/i.test(line) ||
    /^Stream #\d/i.test(line) ||
    /^Stream mapping:/i.test(line) ||
    /^Press \[q\]/i.test(line) ||
    /^size=/i.test(line) ||
    /^Duration:/i.test(line) ||
    /^Metadata:/i.test(line) ||
    /^major_brand/i.test(line) ||
    /^minor_version/i.test(line) ||
    /^compatible_brands/i.test(line) ||
    /^creation_time/i.test(line) ||
    /^handler_name/i.test(line) ||
    /^vendor_id/i.test(line) ||
    /^com\.android/i.test(line) ||
    /^encoder\s*:/i.test(line) ||
    /^\(eng\)/i.test(line) ||
    /^\(default\)/i.test(line)
  );
}

function isFfmpegRelevantLine(line: string): boolean {
  return (
    /\b(error|failed|invalid|nan|inf|saturation|unable)\b/i.test(line) ||
    /conversion failed/i.test(line) ||
    /\[Parsed_/i.test(line) ||
    /\[aost#/i.test(line) ||
    /\[aac @/i.test(line)
  );
}

export function extractFfmpegErrorMessage(rawOutput: string): string {
  const lines = rawOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const relevantLines = lines.filter((line) => !isFfmpegNoiseLine(line) && isFfmpegRelevantLine(line));

  if (relevantLines.length > 0) {
    return relevantLines.slice(-4).join('\n');
  }

  const nonNoiseLines = lines.filter((line) => !isFfmpegNoiseLine(line));

  if (nonNoiseLines.length > 0) {
    return nonNoiseLines.slice(-3).join('\n');
  }

  return 'Audio processing failed.';
}

function buildEffectErrorTitle(effectIds: AudioEffectId[]): string {
  const effectsLabel = getAppliedEffectsLabel(effectIds);

  return effectsLabel ? `Couldn't apply ${effectsLabel}` : "Couldn't apply effects";
}

export function toEffectErrorPresentation(
  error: unknown,
  effectIds: AudioEffectId[],
): EffectErrorPresentation {
  const title = buildEffectErrorTitle(effectIds);

  if (error instanceof FfmpegProcessingError) {
    return {
      title,
      message: extractFfmpegErrorMessage(error.rawOutput),
    };
  }

  if (error instanceof AudioEffectsError) {
    return {
      title: error.title,
      message: error.userMessage,
    };
  }

  if (error instanceof Error) {
    if (error.message.includes('ffmpeg version') || error.message.length > 200) {
      return {
        title,
        message: extractFfmpegErrorMessage(error.message),
      };
    }

    return {
      title,
      message: error.message,
    };
  }

  return {
    title,
    message: 'Audio processing failed.',
  };
}

export function getEffectErrorDebugDetails(error: unknown): string | undefined {
  if (error instanceof AudioEffectsError) {
    return error.debugDetails ?? error.userMessage;
  }

  if (error instanceof FfmpegProcessingError) {
    return error.rawOutput;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return undefined;
}
