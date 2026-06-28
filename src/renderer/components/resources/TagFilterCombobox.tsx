import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { filterTagSuggestions } from '@/utils/videoCatalogTiers'

type Props = {
  id?: string
  value: string | null
  options: string[]
  onChange: (tag: string | null) => void
  allTagsLabel: string
  placeholder?: string
  className?: string
}

export default function TagFilterCombobox({
  id: idProp,
  value,
  options,
  onChange,
  allTagsLabel,
  placeholder,
  className = '',
}: Props) {
  const autoId = useId()
  const inputId = idProp ?? autoId
  const listboxId = `${inputId}-listbox`
  const [inputValue, setInputValue] = useState(value ?? '')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value ?? '')
  }, [value])

  const suggestions = useMemo(
    () => filterTagSuggestions(options, inputValue, 10),
    [options, inputValue],
  )

  const showList = open && suggestions.length > 0

  const selectTag = useCallback(
    (tag: string | null) => {
      onChange(tag)
      setInputValue(tag ?? '')
      setOpen(false)
      setHighlighted(0)
    },
    [onChange],
  )

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    if (highlighted >= suggestions.length) setHighlighted(0)
  }, [highlighted, suggestions.length])

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="flex items-center gap-1">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && suggestions[highlighted] ? `${inputId}-opt-${highlighted}` : undefined
          }
          autoComplete="off"
          value={inputValue}
          placeholder={placeholder ?? allTagsLabel}
          className="w-full rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value)
            setOpen(true)
            setHighlighted(0)
            if (!e.target.value.trim()) onChange(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              setInputValue(value ?? '')
              return
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
              setHighlighted((i) => (suggestions.length ? (i + 1) % suggestions.length : 0))
              return
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setOpen(true)
              setHighlighted((i) =>
                suggestions.length ? (i - 1 + suggestions.length) % suggestions.length : 0,
              )
              return
            }
            if (e.key === 'Enter' && showList && suggestions[highlighted]) {
              e.preventDefault()
              selectTag(suggestions[highlighted]!)
            }
          }}
        />
        {value ? (
          <button
            type="button"
            className="shrink-0 rounded-lg border border-[var(--border-secondary)] px-2 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label={allTagsLabel}
            onClick={() => selectTag(null)}
          >
            ×
          </button>
        ) : null}
      </div>
      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-primary)] shadow-lg py-1"
        >
          {suggestions.map((tag, index) => (
            <li
              key={tag}
              id={`${inputId}-opt-${index}`}
              role="option"
              aria-selected={value === tag}
              className={`cursor-pointer px-2 py-1.5 text-sm ${
                index === highlighted
                  ? 'bg-[var(--accent)]/15 text-[var(--accent-hover)]'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
              onMouseEnter={() => setHighlighted(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectTag(tag)}
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
