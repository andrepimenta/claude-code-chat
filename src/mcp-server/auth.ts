import * as crypto from 'crypto';

export function generateAuthToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateAuthToken(received: string | string[] | undefined, expected: string): boolean {
  if (typeof received !== 'string' || received.length !== expected.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  } catch {
    return false;
  }
}
