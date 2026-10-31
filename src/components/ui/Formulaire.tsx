import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

interface ChampBase {
  libelle: string
  aide?: string
  erreur?: string
}

function Enveloppe({
  id,
  libelle,
  aide,
  erreur,
  children,
}: ChampBase & { id: string; children: ReactNode }) {
  return (
    <div className={['champ', erreur ? 'champ--erreur' : ''].filter(Boolean).join(' ')}>
      <label className="champ__libelle" htmlFor={id}>
        {libelle}
      </label>
      {children}
      {aide && !erreur ? (
        <p className="champ__aide" id={`${id}-aide`}>
          {aide}
        </p>
      ) : null}
      {erreur ? (
        <p className="champ__erreur" id={`${id}-erreur`} role="alert">
          {erreur}
        </p>
      ) : null}
    </div>
  )
}

export function ChampTexte({
  libelle,
  aide,
  erreur,
  className,
  ...reste
}: ChampBase & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Enveloppe id={id} libelle={libelle} aide={aide} erreur={erreur}>
      <input
        id={id}
        className={['champ__saisie', className ?? ''].filter(Boolean).join(' ')}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined}
        {...reste}
      />
    </Enveloppe>
  )
}

export function ChampZone({
  libelle,
  aide,
  erreur,
  ...reste
}: ChampBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Enveloppe id={id} libelle={libelle} aide={aide} erreur={erreur}>
      <textarea
        id={id}
        className="champ__saisie"
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined}
        {...reste}
      />
    </Enveloppe>
  )
}

export function ChampSelect({
  libelle,
  aide,
  erreur,
  children,
  ...reste
}: ChampBase & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <Enveloppe id={id} libelle={libelle} aide={aide} erreur={erreur}>
      <select
        id={id}
        className="champ__saisie"
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined}
        {...reste}
      >
        {children}
      </select>
    </Enveloppe>
  )
}
