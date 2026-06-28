type Props = {
  direction: 'prev' | 'next'
  label: string
  onClick: () => void
}

export function GalleryLightboxNavArrow({ direction, label, onClick }: Props) {
  return (
    <button
      type="button"
      className={`gallery-lightbox-nav gallery-lightbox-nav--${direction}`}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <span className="gallery-lightbox-nav__triangle" aria-hidden />
    </button>
  )
}
