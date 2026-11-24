import Image from 'next/image'
import type { Mandate } from '@/lib/mandates'
import { SurveyPlate } from './SurveyPlate'

/**
 * The visual for a mandate: a colour-graded photograph, or a generated survey plate
 * for land whose location is withheld. Always fills its (aspect-ratio) parent.
 */
export function MandateVisual({
  mandate,
  sizes,
  priority = false,
  className = '',
}: {
  mandate: Mandate
  sizes: string
  priority?: boolean
  className?: string
}) {
  const real = realStill(mandate)
  if (real) {
    return (
      <Image
        src={real.src}
        alt={real.alt}
        fill
        priority={priority}
        sizes={sizes}
        className={`object-cover tharaga-grade ${className}`}
      />
    )
  }
  if (mandate.plate || !mandate.image) {
    return (
      <div className={`absolute inset-0 ${className}`}>
        <SurveyPlate
          seed={mandate.slug}
          label={mandate.region}
          caption={mandate.plate?.caption}
          tone={mandate.plate?.tone ?? 'navy'}
        />
      </div>
    )
  }
  return (
    <Image
      src={mandate.image}
      alt={mandate.imageAlt || mandate.name}
      fill
      priority={priority}
      sizes={sizes}
      className={`object-cover tharaga-grade ${className}`}
    />
  )
}

/** First real still for a mandate: a site photo, else a video poster. */
export function realStill(m: Mandate): { src: string; alt: string } | null {
  const media = m.media ?? []
  const video = media.find(x => x.kind === 'video' && x.poster)
  if (video?.poster) return { src: video.poster, alt: video.alt }
  const photo = media.find(x => x.kind === 'photo')
  if (photo) return { src: photo.src, alt: photo.alt }
  return null
}

export const isPlate = (m: Mandate) => !realStill(m) && Boolean(m.plate || !m.image)
