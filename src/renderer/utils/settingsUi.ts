export function settingsChoiceClass(selected: boolean, compact = false): string {
  const base = 'settings-choice-btn'
  const mod = compact ? ' settings-choice-btn--compact' : ''
  return `${base}${mod}${selected ? ' settings-choice-btn--selected' : ''}`
}

export function settingsOptionClass(selected: boolean): string {
  return `settings-option${selected ? ' settings-option--selected' : ''}`
}

export function settingsChipClass(selected: boolean, disabled = false): string {
  return `settings-chip${selected ? ' settings-chip--selected' : ''}${disabled ? ' settings-chip--disabled' : ''}`
}
