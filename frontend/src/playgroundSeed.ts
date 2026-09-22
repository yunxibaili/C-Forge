let seed: string | null = null;

export function setPlaygroundSeed(code: string) {
  seed = code;
}

export function takePlaygroundSeed(): string | null {
  const s = seed;
  seed = null;
  return s;
}
