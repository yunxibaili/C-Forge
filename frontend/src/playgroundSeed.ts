let seed: string | null = null;

export function setPlaygroundSeed(code: string) {
  seed = code;
}

export function peekPlaygroundSeed(): string | null {
  return seed;
}

export function clearPlaygroundSeed() {
  seed = null;
}
