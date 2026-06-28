/** Map a keyboard event to an Electron globalShortcut accelerator string. */
export function keyboardEventToAccelerator(event: KeyboardEvent): string | null {
  if (event.key === 'Escape') return null

  const modifierOnly = new Set(['Control', 'Alt', 'Shift', 'Meta'])
  if (modifierOnly.has(event.key)) return null

  const parts: string[] = []
  if (event.ctrlKey || event.metaKey) parts.push('CommandOrControl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')

  const key = acceleratorKeyFromEvent(event)
  if (!key) return null
  parts.push(key)

  return parts.join('+')
}

function acceleratorKeyFromEvent(event: KeyboardEvent): string | null {
  const { key, code } = event

  if (key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
    return key.toUpperCase()
  }

  if (/^F\d{1,2}$/i.test(key)) return key.toUpperCase()

  const arrow = key.match(/^Arrow(Left|Right|Up|Down)$/)
  if (arrow) return arrow[1]!

  const codeLetter = code.match(/^Key([A-Z])$/)
  if (codeLetter) return codeLetter[1]!

  const codeDigit = code.match(/^Digit([0-9])$/)
  if (codeDigit) return codeDigit[1]!

  const named: Record<string, string> = {
    ' ': 'Space',
    Space: 'Space',
    Tab: 'Tab',
    Enter: 'Enter',
    Return: 'Enter',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Insert: 'Insert',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
    Plus: 'Plus',
    Minus: 'Minus',
  }

  return named[key] ?? null
}

/** Human-readable label for settings UI (Ctrl+Alt+W). */
export function formatShortcutDisplay(accelerator: string): string {
  return accelerator
    .split('+')
    .map((part) => {
      if (part === 'CommandOrControl') return 'Ctrl'
      if (part === 'Command') return 'Cmd'
      if (part === 'Control') return 'Ctrl'
      if (part === 'Option') return 'Alt'
      return part
    })
    .join('+')
}
