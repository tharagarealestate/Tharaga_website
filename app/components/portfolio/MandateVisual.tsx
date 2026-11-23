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

export const isPlate = (m: Mandate) => Boolean(m.plate || !m.image)
