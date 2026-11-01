import type { Icon } from '@phosphor-icons/react'
import { ArrowsClockwiseIcon, CarIcon, CubeIcon, HardHatIcon, ShapesIcon, WrenchIcon } from '@phosphor-icons/react'
import type { ArticleType } from './articles'

export const TYPE_ICONS: Record<ArticleType, Icon> = {
  service: WrenchIcon,
  produit: CubeIcon,
  'main-oeuvre': HardHatIcon,
  deplacement: CarIcon,
  abonnement: ArrowsClockwiseIcon,
  autre: ShapesIcon,
}
