import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import './Formulaire.css'

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
    <div className={erreur ? 'field field--error' : 'field'}>
      <label className="field__label" htmlFor={id}>
        {libelle}
      </label>
      {children}
      {aide && !erreur ? (
        <p className="field__hint" id={`${id}-aide`}>
          {aide}
        </p>
      ) : null}
      {erreur ? (
        <p className="field__error" id={`${id}-erreur`} role="alert">
          {erreur}
        </p>
      ) : null}
    </div>
  )
}

const classes = (...liste: (string | undefined)[]) => liste.filter(Boolean).join(' ')

/** Attributs ARIA communs : le message d'erreur prime sur l'aide. */
function aria(id: string, aide?: string, erreur?: string) {
  return {
    'aria-invalid': erreur ? (true as const) : undefined,
    'aria-describedby': erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined,
  }
}

type ChampTexteProps = ChampBase &
  InputHTMLAttributes<HTMLInputElement> & {
    /** Unité affichée dans le champ, à droite (`€`, `%`…). */
    suffixe?: string
  }

export function ChampTexte({ libelle, aide, erreur, suffixe, className, ...reste }: ChampTexteProps) {
  const id = useId()
  const saisie = (
    <input
      id={id}
      className={classes('input', className)}
      {...aria(id, aide, erreur)}
      {...reste}
    />
  )
  return (
    <Enveloppe id={id} libelle={libelle} aide={aide} erreur={erreur}>
      {suffixe ? (
        <div className="input-affix">
          {saisie}
          <span className="input-affix__suffix" aria-hidden="true">
            {suffixe}
          </span>
        </div>
      ) : (
        saisie
      )}
    </Enveloppe>
  )
}

export function ChampZone({
  libelle,
  aide,
  erreur,
  className,
  ...reste
}: ChampBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Enveloppe id={id} libelle={libelle} aide={aide} erreur={erreur}>
      <textarea id={id} className={classes('textarea', className)} {...aria(id, aide, erreur)} {...reste} />
    </Enveloppe>
  )
}

export function ChampSelect({
  libelle,
  aide,
  erreur,
  className,
  children,
  ...reste
}: ChampBase & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <Enveloppe id={id} libelle={libelle} aide={aide} erreur={erreur}>
      <select id={id} className={classes('select', className)} {...aria(id, aide, erreur)} {...reste}>
        {children}
      </select>
    </Enveloppe>
  )
}
