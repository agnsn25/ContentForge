// Transcript cleaning module — strips token-wasting noise from raw transcripts
// without losing any substantive content.

import type { SourceType } from "@shared/schema";

export interface CleaningStats {
  originalLength: number;
  cleanedLength: number;
  reductionPercent: number;
  duplicatesRemoved: number;
  fillersRemoved: number;
}

export function cleanTranscript(
  raw: string,
  sourceType: SourceType
): { cleaned: string; stats: CleaningStats } {
  const stats: CleaningStats = {
    originalLength: raw.length,
    cleanedLength: 0,
    reductionPercent: 0,
    duplicatesRemoved: 0,
    fillersRemoved: 0,
  };

  // Spotify transcripts are placeholders — skip entirely
  if (sourceType === 'spotify') {
    stats.cleanedLength = raw.length;
    return { cleaned: raw, stats };
  }

  let text = raw;

  // For file uploads, only normalize whitespace
  if (sourceType === 'file') {
    text = normalizeWhitespace(text);
    text = removeEmptyLines(text);
    stats.cleanedLength = text.length;
    stats.reductionPercent = calcReduction(stats.originalLength, stats.cleanedLength);
    return { cleaned: text, stats };
  }

  // YouTube: full cleaning pipeline

  // Step 1: Strip timestamp prefixes like [0:00], [12:34], [1:23:45]
  text = text.replace(/^\[\d{1,2}(?::\d{2}){1,2}\]\s*/gm, '');

  // Step 2: Remove bracket noise metadata
  text = text.replace(/\[(?:Music|Applause|Laughter|Inaudible|Silence)\]/gi, '');

  // Step 3: Remove standalone filler words
  const fillerPattern = /\b(?:um|uh|uhh|umm)\b[,]?\s*/gi;
  const fillerMatches = text.match(fillerPattern);
  stats.fillersRemoved = fillerMatches ? fillerMatches.length : 0;
  text = text.replace(fillerPattern, '');

  // Step 4: Deduplicate overlapping auto-caption segments
  const lines = text.split('\n');
  const deduped: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      deduped.push('');
      continue;
    }

    let isDuplicate = false;
    // 3-line lookback
    const lookbackStart = Math.max(0, deduped.length - 3);
    for (let j = lookbackStart; j < deduped.length; j++) {
      const prev = deduped[j];
      if (!prev) continue;
      // Skip if current is substring of recent line or vice versa
      if (prev.includes(line) || line.includes(prev)) {
        isDuplicate = true;
        // If current line is longer (superset), replace the shorter one
        if (line.length > prev.length) {
          deduped[j] = line;
        }
        break;
      }
    }

    if (!isDuplicate) {
      deduped.push(line);
    } else {
      stats.duplicatesRemoved++;
    }
  }
  text = deduped.join('\n');

  // Step 5: Normalize whitespace
  text = normalizeWhitespace(text);

  // Step 6: Remove empty lines left over from cleaning
  text = removeEmptyLines(text);

  stats.cleanedLength = text.length;
  stats.reductionPercent = calcReduction(stats.originalLength, stats.cleanedLength);

  return { cleaned: text, stats };
}

function normalizeWhitespace(text: string): string {
  // Collapse multiple spaces to single
  text = text.replace(/ {2,}/g, ' ');
  // Collapse 3+ newlines to double newline
  text = text.replace(/\n{3,}/g, '\n\n');
  // Trim each line
  text = text.split('\n').map(l => l.trim()).join('\n');
  return text.trim();
}

function removeEmptyLines(text: string): string {
  return text.split('\n').filter(l => l.length > 0).join('\n');
}

function calcReduction(original: number, cleaned: number): number {
  if (original === 0) return 0;
  return Math.round(((original - cleaned) / original) * 100);
}

// Rough token estimate: ~4 chars per token for English text
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export const MAX_CONTEXT_TOKENS = 123_000;
