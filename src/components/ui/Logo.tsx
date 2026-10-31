interface LogoProps {
  className?: string
}

/** Symbole S + mot SENOVA, tirés des fichiers du logo officiel (sans le slogan). */
export function Logo({ className }: LogoProps) {
  return (
    <span className={['logo', className ?? ''].filter(Boolean).join(' ')}>
      <img className="logo__symbole" src="/logo-symbole.png" alt="" />
      <img className="logo__mot" src="/logo-mot.png" alt="SENOVA" />
    </span>
  )
}
