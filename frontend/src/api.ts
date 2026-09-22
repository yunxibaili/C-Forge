import type { RunResult } from "./types";

export async function runCode(code: string): Promise<RunResult> {
  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    throw new Error("backend error " + res.status);
  }
  return (await res.json()) as RunResult;
}
