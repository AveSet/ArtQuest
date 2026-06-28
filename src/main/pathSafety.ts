import path from 'path'

/** True when candidate is the root itself or a descendant of root. */
export function isPathUnderRoot(candidatePath: string, rootPath: string): boolean {
  const resolvedCandidate = path.resolve(candidatePath)
  const resolvedRoot = path.resolve(rootPath)
  if (resolvedCandidate === resolvedRoot) return true
  const rootWithSep = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep
  return resolvedCandidate.startsWith(rootWithSep)
}
