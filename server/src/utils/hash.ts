import crypto from 'crypto';

export function hashTranscript(transcript: string): string {
  const normalized = transcript.trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
