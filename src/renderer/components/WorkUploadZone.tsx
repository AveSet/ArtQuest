import { useCallback, useRef, useState } from 'react'
import { useI18n } from '@/i18n'

const DEFAULT_ACCEPT = 'image/*,video/mp4,video/webm,video/quicktime'

type Props = {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
  className?: string
  disabled?: boolean
}

function filterAccepted(files: FileList | File[], accept: string): File[] {
  const arr = Array.from(files)
  if (!accept || accept.includes('*')) return arr.filter(Boolean)
  const parts = accept.split(',').map((p) => p.trim().toLowerCase())
  return arr.filter((file) => {
    const name = file.name.toLowerCase()
    const type = (file.type || '').toLowerCase()
    return parts.some((part) => {
      if (part.startsWith('.')) return name.endsWith(part)
      if (part.endsWith('/*')) return type.startsWith(part.slice(0, -1))
      return type === part
    })
  })
}

/** Drop zone + paste + file picker trigger for quest work uploads. */
export default function WorkUploadZone({
  onFilesSelected,
  accept = DEFAULT_ACCEPT,
  multiple = true,
  className = '',
  disabled = false,
}: Props) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const emitFiles = useCallback(
    (raw: FileList | File[]) => {
      const picked = filterAccepted(raw, accept)
      if (picked.length > 0) onFilesSelected(picked)
    },
    [accept, onFilesSelected],
  )

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (disabled) return
      const items = e.clipboardData?.files
      if (items && items.length > 0) {
        e.preventDefault()
        emitFiles(items)
      }
    },
    [disabled, emitFiles],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (disabled) return
      if (e.dataTransfer.files.length > 0) emitFiles(e.dataTransfer.files)
    },
    [disabled, emitFiles],
  )

  return (
    <div
      className={`work-upload-zone${dragOver ? ' work-upload-zone--active' : ''}${disabled ? ' work-upload-zone--disabled' : ''} ${className}`.trim()}
      onDragEnter={(e) => {
        e.preventDefault()
        if (!disabled) setDragOver(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragOver(true)
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        setDragOver(false)
      }}
      onDrop={onDrop}
      onPaste={onPaste}
      tabIndex={disabled ? -1 : 0}
      role="group"
      aria-label={t.upload.dropZoneLabel}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) emitFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="btn-secondary text-lg py-4 w-full"
      >
        📁 {t.common.selectFile}
      </button>
      <p className="text-xs text-[var(--text-muted)] text-center mt-2">{t.upload.dropHint}</p>
    </div>
  )
}
