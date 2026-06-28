import { mediaKindFromPath } from '@/utils/mediaKind'

type Props = {
  url: string
  file?: File | null
  alt?: string
  className?: string
  onRemove?: () => void
  removeLabel?: string
}

/** Preview for quest submit flow — images and mp4/video. */
export default function WorkUploadPreview({
  url,
  file,
  alt = '',
  className = 'w-full h-32 object-cover rounded-lg',
  onRemove,
  removeLabel = 'Remove',
}: Props) {
  const kind = mediaKindFromPath(file?.name || url)

  return (
    <div className="relative animate-upload-fade-in">
      {kind === 'video' ? (
        <video
          src={url}
          className={className}
          controls
          playsInline
          preload="metadata"
          aria-label={alt || undefined}
        />
      ) : (
        <img src={url} alt={alt} className={className} />
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 btn-dismiss-overlay w-6 h-6 rounded-full text-sm"
          aria-label={removeLabel}
        >
          ✕
        </button>
      )}
    </div>
  )
}
