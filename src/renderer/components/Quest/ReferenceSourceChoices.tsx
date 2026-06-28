type Props = {
  youtubeLongLabel: string
  youtubeShortLabel: string
  pinterestLabel: string
  clipTipsLabel: string
  sketchfabLabel: string
  onYoutubeLong: () => void
  onYoutubeShort: () => void
  onPinterest: () => void
  onClipTips: () => void
  onSketchfab: () => void
}

export default function ReferenceSourceChoices({
  youtubeLongLabel,
  youtubeShortLabel,
  pinterestLabel,
  clipTipsLabel,
  sketchfabLabel,
  onYoutubeLong,
  onYoutubeShort,
  onPinterest,
  onClipTips,
  onSketchfab,
}: Props) {
  return (
    <div className="flex flex-wrap gap-1.5 w-full">
      <button type="button" onClick={onYoutubeLong} className="btn-secondary flex-1 min-w-[6.5rem] py-1.5 text-xs">
        ▶ {youtubeLongLabel}
      </button>
      <button type="button" onClick={onYoutubeShort} className="btn-secondary flex-1 min-w-[6.5rem] py-1.5 text-xs">
        ▶ {youtubeShortLabel}
      </button>
      <button type="button" onClick={onPinterest} className="btn-secondary flex-1 min-w-[6.5rem] py-1.5 text-xs">
        📌 {pinterestLabel}
      </button>
      <button type="button" onClick={onClipTips} className="btn-secondary flex-1 min-w-[6.5rem] py-1.5 text-xs">
        🎨 {clipTipsLabel}
      </button>
      <button type="button" onClick={onSketchfab} className="btn-secondary flex-1 min-w-[6.5rem] py-1.5 text-xs">
        🧊 {sketchfabLabel}
      </button>
    </div>
  )
}
