/** Debug logging — stripped in production builds. */
export function devLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log(...args)
  }
}

export function devInfo(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.info(...args)
  }
}

export function devWarn(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.warn(...args)
  }
}
