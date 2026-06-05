/** Merge streaming voice chunks into the assistant input value. */
export function mergeProviderVoiceTranscript(
  base: string,
  chunk: string,
  isFinal: boolean,
): { merged: string; nextBase: string } | null {
  const trimmed = chunk.trim();
  if (!trimmed && !isFinal) return null;
  const merged = base ? `${base} ${trimmed}`.trim() : trimmed;
  return { merged, nextBase: isFinal ? merged : base };
}
