import type { ReactNode } from 'react'
import './Badge.css'

export type TonBadge = 'neutre' | 'succes' | 'alerte' | 'danger' | 'info'

/** Le sens passe toujours par le texte : la couleur n'est qu'un renfort. */
export function Badge({ ton = 'neutre', children }: { ton?: TonBadge; children: ReactNode }) {
  return <span className={`badge ${ton === 'neutre' ? '' : `badge--${ton}`}`}>{children}</span>
}
