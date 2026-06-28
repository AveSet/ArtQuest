let saveChain: Promise<unknown> = Promise.resolve(true)

/** Serialize async save operations to prevent out-of-order chunk writes. */
export function enqueueSave<T>(task: () => Promise<T>): Promise<T> {
  const run = saveChain.then(task, task)
  saveChain = run.catch(() => false)
  return run
}

/** @internal Vitest only */
export function resetSaveQueueForTests(): void {
  saveChain = Promise.resolve(true)
}
