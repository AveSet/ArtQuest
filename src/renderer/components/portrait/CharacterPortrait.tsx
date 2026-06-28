import { memo, useId, useState, useCallback } from 'react'
import type { PortraitGender } from '@/store/models'
import { getPortraitImageSources } from '@/utils/portraitAssets'

type Props = {
  gender: PortraitGender
  size?: 'sm' | 'md' | 'lg'
  className?: string
  idle?: boolean
  /** User-selected square crop; replaces default gender portrait when set. */
  customSrc?: string | null
}

/** Inline SVG fallback when raster portrait files are missing or fail to load. */
function PortraitSvgFallback({ gender, uid }: { gender: PortraitGender; uid: string }) {
  const isFemale = gender === 'female'
  const bg = `portrait-bg-${uid}`
  const skin = `portrait-skin-${uid}`
  const hair = `portrait-hair-${uid}`
  const armor = `portrait-armor-${uid}`

  return (
    <svg viewBox="0 0 200 200" className="character-portrait-svg" aria-hidden>
      <defs>
        <linearGradient id={bg} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a2840" />
          <stop offset="100%" stopColor="#0d1220" />
        </linearGradient>
        <linearGradient id={skin} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e8c4a0" />
          <stop offset="55%" stopColor="#d4a67a" />
          <stop offset="100%" stopColor="#b88860" />
        </linearGradient>
        <linearGradient id={hair} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6a5038" />
          <stop offset="100%" stopColor="#3a2818" />
        </linearGradient>
        <linearGradient id={armor} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5a6278" />
          <stop offset="100%" stopColor="#2a3040" />
        </linearGradient>
      </defs>

      <rect width="200" height="200" fill={`url(#${bg})`} />
      <ellipse cx="100" cy="105" rx="78" ry="88" fill="#000" opacity="0.12" />

      {isFemale && (
        <path
          d="M48 78 C42 110, 44 150, 58 178 C72 192, 128 192, 142 178 C156 150, 158 110, 152 78 C140 120, 60 120, 48 78 Z"
          fill={`url(#${hair})`}
        />
      )}

      <path d="M24 168 Q100 148 176 168 L176 200 L24 200 Z" fill={`url(#${armor})`} />
      <path d="M58 158 L100 148 L142 158 L142 172 L58 172 Z" fill="#8a9098" opacity="0.35" />
      <ellipse cx="100" cy="162" rx="22" ry="8" fill="#c8a858" opacity="0.9" />
      <path d="M88 128 L88 152 Q100 158 112 152 L112 128 Z" fill={`url(#${skin})`} />
      <path
        d="M100 52 C72 52, 58 72, 58 98 C58 118, 72 132, 100 134 C128 132, 142 118, 142 98 C142 72, 128 52, 100 52 Z"
        fill={`url(#${skin})`}
      />
      <path d="M68 108 Q100 128 132 108 L132 118 Q100 138 68 118 Z" fill="#a87858" opacity="0.25" />
      <ellipse cx="58" cy="98" rx="6" ry="9" fill={`url(#${skin})`} />
      <ellipse cx="142" cy="98" rx="6" ry="9" fill={`url(#${skin})`} />

      {isFemale ? (
        <>
          <path d="M56 82 C54 52, 146 52, 144 82 C138 68, 62 68, 56 82 Z" fill={`url(#${hair})`} />
          <path d="M52 90 C48 130, 54 165, 64 175 L72 160 C66 130, 68 100, 72 88 Z" fill="#4a3828" />
          <path d="M148 90 C152 130, 146 165, 136 175 L128 160 C134 130, 132 100, 128 88 Z" fill="#4a3828" />
        </>
      ) : (
        <>
          <path d="M58 84 C60 58, 140 58, 142 84 C136 72, 64 72, 58 84 Z" fill={`url(#${hair})`} />
          <path d="M62 78 L72 68 L88 72 L100 66 L112 72 L128 68 L138 78 L132 86 L68 86 Z" fill="#5a4830" />
        </>
      )}

      <path d="M74 86 L92 82" stroke="#3a2818" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M108 82 L126 86" stroke="#3a2818" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="82" cy="96" rx="9" ry="6" fill="#f8f4ec" />
      <ellipse cx="118" cy="96" rx="9" ry="6" fill="#f8f4ec" />
      <circle cx="83" cy="96" r="4" fill="#3a6a48" />
      <circle cx="119" cy="96" r="4" fill="#3a6a48" />
      <circle cx="84.5" cy="94.5" r="1.5" fill="#fff" opacity="0.9" />
      <circle cx="120.5" cy="94.5" r="1.5" fill="#fff" opacity="0.9" />
      <path d="M100 100 L96 110 Q100 113 104 110 Z" fill="#c89870" opacity="0.45" />
      <path d="M88 118 Q100 124 112 118" stroke="#9a6850" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function PortraitImage({
  gender,
  uid,
  size,
}: {
  gender: PortraitGender
  uid: string
  size: Props['size']
}) {
  const sources = getPortraitImageSources(gender)
  const [sourceIndex, setSourceIndex] = useState(0)

  const onImageError = useCallback(() => {
    setSourceIndex((index) => index + 1)
  }, [])

  if (sourceIndex >= sources.length) {
    return <PortraitSvgFallback gender={gender} uid={uid} />
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt=""
      aria-hidden
      width={512}
      height={512}
      className="character-portrait__image"
      loading={size === 'lg' ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={size === 'lg' ? 'high' : 'auto'}
      onError={onImageError}
    />
  )
}

const CharacterPortrait = memo(function CharacterPortrait({
  gender,
  size = 'md',
  className = '',
  idle = false,
  customSrc = null,
}: Props) {
  const uid = useId().replace(/:/g, '')

  return (
    <div
      className={`character-portrait character-portrait--${size}${idle ? ' character-portrait--idle' : ''}${customSrc ? ' character-portrait--custom' : ''} ${className}`.trim()}
      data-gender={gender}
      data-portrait-mode={customSrc ? 'custom' : 'image'}
    >
      <div className="character-portrait__frame">
        {customSrc ? (
          <img
            src={customSrc}
            alt=""
            aria-hidden
            className="character-portrait__image"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <PortraitImage gender={gender} uid={uid} size={size} />
        )}
      </div>
    </div>
  )
})

export default CharacterPortrait
