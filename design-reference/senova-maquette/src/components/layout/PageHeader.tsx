import type { ReactNode } from 'react'

interface Props {
  title: string
  count?: number
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, count, description, actions }: Props) {
  return (
    <div className="page-header">
      <div className="page-header__text">
        <h1 className="page-header__title">
          {title}
          {count != null && <span className="page-header__count num">{count}</span>}
        </h1>
        {description && <p className="page-header__desc">{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  )
}
